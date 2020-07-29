// in `src/alloc.rs`

use std::sync::atomic::{AtomicBool, Ordering};
use std::alloc::{GlobalAlloc, System};
use std::io::Cursor;

use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum Event {
    Alloc { addr: usize, size: usize },
    Freed { addr: usize, size: usize },
}

pub struct Tracing {
    pub inner: System,
    pub active: AtomicBool,
}

impl Tracing {
    pub const fn new() -> Self {
        Self {
            inner: System,
            active: AtomicBool::new(false),
        }
    }

    pub fn set_active(&self, active: bool) {
        self.active.store(active, Ordering::SeqCst);
    }

    fn write_ev(&self, ev: Event) {
        let mut buf = [0u8; 1024];
        let mut cursor = Cursor::new(&mut buf[..]);
        serde_json::to_writer(&mut cursor, &ev).unwrap();
        let end = cursor.position() as usize;
        self.write(&buf[..end]);
        self.write(b"\n");
    }

    fn write(&self, s: &[u8]) {
        unsafe {
            libc::write(libc::STDERR_FILENO, s.as_ptr() as _, s.len() as _);
        }
    }
}

unsafe impl GlobalAlloc for Tracing {
    unsafe fn alloc(&self, layout: std::alloc::Layout) -> *mut u8 {
        let res = self.inner.alloc(layout);
        if self.active.load(Ordering::SeqCst) {
            self.write_ev(Event::Alloc {
                addr: res as _,
                size: layout.size(),
            });
        }
        res
    }
    unsafe fn dealloc(&self, ptr: *mut u8, layout: std::alloc::Layout) {
        if self.active.load(Ordering::SeqCst) {
            self.write_ev(Event::Freed {
                addr: ptr as _,
                size: layout.size(),
            });
        }
        self.inner.dealloc(ptr, layout)
    }
}
