import * as wasm from './dataworker_bg.wasm';

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let WASM_VECTOR_LEN = 0;

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachegetInt32Memory0 = null;
function getInt32Memory0() {
    if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
        cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachegetInt32Memory0;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1 };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) wasm.__wbindgen_export_2.get(dtor)(a, state.b);
            else state.a = a;
        }
    };
    real.original = state;
    return real;
}
function __wbg_adapter_30(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h40c816f015435947(arg0, arg1, addHeapObject(arg2));
}

let cachegetUint32Memory0 = null;
function getUint32Memory0() {
    if (cachegetUint32Memory0 === null || cachegetUint32Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint32Memory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachegetUint32Memory0;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4);
    getUint32Memory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function getArrayU32FromWasm0(ptr, len) {
    return getUint32Memory0().subarray(ptr / 4, ptr / 4 + len);
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}

function handleError(f) {
    return function () {
        try {
            return f.apply(this, arguments);

        } catch (e) {
            wasm.__wbindgen_exn_store(addHeapObject(e));
        }
    };
}
function __wbg_adapter_93(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__h84d25aa449a68259(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

/**
*/
export const Filetype = Object.freeze({ CSV:0,JSON:1, });
/**
*/
export class Chunk {

    static __wrap(ptr) {
        const obj = Object.create(Chunk.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_chunk_free(ptr);
    }
    /**
    * @param {string} url
    * @param {string} text
    * @param {number} filetype
    * @returns {Chunk}
    */
    static new(url, text, filetype) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        var ret = wasm.chunk_new(ptr0, len0, ptr1, len1, filetype);
        return Chunk.__wrap(ret);
    }
    /**
    * @returns {number}
    */
    length() {
        var ret = wasm.chunk_length(this.ptr);
        return ret >>> 0;
    }
    /**
    * @returns {number}
    */
    count() {
        var ret = wasm.chunk_count(this.ptr);
        return ret >>> 0;
    }
    /**
    * @returns {number}
    */
    data() {
        var ret = wasm.chunk_data(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    min() {
        var ret = wasm.chunk_min(this.ptr);
        return ret >>> 0;
    }
    /**
    * @returns {number}
    */
    max() {
        var ret = wasm.chunk_max(this.ptr);
        return ret >>> 0;
    }
    /**
    * @returns {number}
    */
    sum() {
        var ret = wasm.chunk_sum(this.ptr);
        return ret >>> 0;
    }
    /**
    * @returns {number}
    */
    avg() {
        var ret = wasm.chunk_avg(this.ptr);
        return ret;
    }
    /**
    * @returns {any}
    */
    keys() {
        var ret = wasm.chunk_keys(this.ptr);
        return takeObject(ret);
    }
    /**
    * @param {number} value
    * @returns {number}
    */
    transform(value) {
        var ret = wasm.chunk_transform(this.ptr, value);
        return ret;
    }
    /**
    * @param {Uint32Array} sort
    * @returns {Uint32Array}
    */
    sort(sort) {
        var ptr0 = passArray32ToWasm0(sort, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.chunk_sort(8, this.ptr, ptr0, len0);
        var r0 = getInt32Memory0()[8 / 4 + 0];
        var r1 = getInt32Memory0()[8 / 4 + 1];
        var v1 = getArrayU32FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 4);
        return v1;
    }
    /**
    * @param {string} key
    * @returns {number}
    */
    expose_key_int(key) {
        var ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.chunk_expose_key_int(this.ptr, ptr0, len0);
        return ret;
    }
    /**
    * @param {string} key
    * @returns {number}
    */
    expose_key_float(key) {
        var ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.chunk_expose_key_float(this.ptr, ptr0, len0);
        return ret;
    }
    /**
    * @param {string} key
    * @returns {number}
    */
    expose_key_string(key) {
        var ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.chunk_expose_key_string(this.ptr, ptr0, len0);
        return ret;
    }
    /**
    * @returns {any}
    */
    to_object() {
        var ret = wasm.chunk_to_object(this.ptr);
        return takeObject(ret);
    }
    /**
    * @param {number} index
    */
    select(index) {
        wasm.chunk_select(this.ptr, index);
    }
}
/**
*/
export class Dataworker {

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_dataworker_free(ptr);
    }
    /**
    * @param {string} url
    * @param {number} filetype
    * @returns {any}
    */
    static getData(url, filetype) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.dataworker_getData(ptr0, len0, filetype);
        return takeObject(ret);
    }
    /**
    * @param {string} url
    * @param {number} filetype
    * @param {Chunk} chunk
    * @returns {any}
    */
    static append(url, filetype, chunk) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        _assertClass(chunk, Chunk);
        var ptr1 = chunk.ptr;
        chunk.ptr = 0;
        var ret = wasm.dataworker_append(ptr0, len0, filetype, ptr1);
        return takeObject(ret);
    }
}

export const __wbindgen_cb_drop = function(arg0) {
    const obj = takeObject(arg0).original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    var ret = false;
    return ret;
};

export const __wbindgen_object_drop_ref = function(arg0) {
    takeObject(arg0);
};

export const __wbg_chunk_new = function(arg0) {
    var ret = Chunk.__wrap(arg0);
    return addHeapObject(ret);
};

export const __wbindgen_json_serialize = function(arg0, arg1) {
    const obj = getObject(arg1);
    var ret = JSON.stringify(obj === undefined ? null : obj);
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export const __wbg_log_416c39df0b643b1f = function(arg0, arg1) {
    console.log(getStringFromWasm0(arg0, arg1));
};

export const __wbindgen_json_parse = function(arg0, arg1) {
    var ret = JSON.parse(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export const __wbg_instanceof_Window_d64060d13377409b = function(arg0) {
    var ret = getObject(arg0) instanceof Window;
    return ret;
};

export const __wbg_fetch_b3f48cf99ebd282a = function(arg0, arg1) {
    var ret = getObject(arg0).fetch(getObject(arg1));
    return addHeapObject(ret);
};

export const __wbg_new_7a16f5ab78713694 = handleError(function() {
    var ret = new Headers();
    return addHeapObject(ret);
});

export const __wbg_append_87ddbc43059c5e2e = handleError(function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
});

export const __wbindgen_object_clone_ref = function(arg0) {
    var ret = getObject(arg0);
    return addHeapObject(ret);
};

export const __wbindgen_string_new = function(arg0, arg1) {
    var ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export const __wbg_instanceof_Response_acb554d7c391aef7 = function(arg0) {
    var ret = getObject(arg0) instanceof Response;
    return ret;
};

export const __wbg_url_2d24e829e8bc1b01 = function(arg0, arg1) {
    var ret = getObject(arg1).url;
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export const __wbg_status_574d79b00800f0b0 = function(arg0) {
    var ret = getObject(arg0).status;
    return ret;
};

export const __wbg_headers_0414df4d30831dc7 = function(arg0) {
    var ret = getObject(arg0).headers;
    return addHeapObject(ret);
};

export const __wbg_text_83594a5e8d9e514a = handleError(function(arg0) {
    var ret = getObject(arg0).text();
    return addHeapObject(ret);
});

export const __wbg_newwithstrandinit_54427750de69ea87 = handleError(function(arg0, arg1, arg2) {
    var ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
    return addHeapObject(ret);
});

export const __wbindgen_is_function = function(arg0) {
    var ret = typeof(getObject(arg0)) === 'function';
    return ret;
};

export const __wbindgen_is_object = function(arg0) {
    const val = getObject(arg0);
    var ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export const __wbg_next_0e8d2244de74635b = function(arg0) {
    var ret = getObject(arg0).next;
    return addHeapObject(ret);
};

export const __wbg_next_7a1e3e5ba77a5417 = handleError(function(arg0) {
    var ret = getObject(arg0).next();
    return addHeapObject(ret);
});

export const __wbg_done_179f9d81f2c93943 = function(arg0) {
    var ret = getObject(arg0).done;
    return ret;
};

export const __wbg_value_dd36c45a14714446 = function(arg0) {
    var ret = getObject(arg0).value;
    return addHeapObject(ret);
};

export const __wbg_iterator_6bd049bef6e3ba19 = function() {
    var ret = Symbol.iterator;
    return addHeapObject(ret);
};

export const __wbg_get_fa38f22e54fe1ab1 = handleError(function(arg0, arg1) {
    var ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
});

export const __wbg_call_20c04382b27a4486 = handleError(function(arg0, arg1) {
    var ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
});

export const __wbg_new_03a50b2d1045a68f = function(arg0, arg1) {
    var ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export const __wbg_newnoargs_bfddd41728ab0b9c = function(arg0, arg1) {
    var ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export const __wbg_call_49bac88c9eff93af = handleError(function(arg0, arg1, arg2) {
    var ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
});

export const __wbg_new_f46e6afe0b8a862e = function() {
    var ret = new Object();
    return addHeapObject(ret);
};

export const __wbg_new_261626435fed913c = function(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_93(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        var ret = new Promise(cb0);
        return addHeapObject(ret);
    } finally {
        state0.a = state0.b = 0;
    }
};

export const __wbg_resolve_430b2f40a51592cc = function(arg0) {
    var ret = Promise.resolve(getObject(arg0));
    return addHeapObject(ret);
};

export const __wbg_then_a9485ea9ef567f90 = function(arg0, arg1) {
    var ret = getObject(arg0).then(getObject(arg1));
    return addHeapObject(ret);
};

export const __wbg_then_b114127b40814c36 = function(arg0, arg1, arg2) {
    var ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export const __wbg_self_944d201f31e01c91 = handleError(function() {
    var ret = self.self;
    return addHeapObject(ret);
});

export const __wbg_window_993fd51731b86960 = handleError(function() {
    var ret = window.window;
    return addHeapObject(ret);
});

export const __wbg_globalThis_8379563d70fab135 = handleError(function() {
    var ret = globalThis.globalThis;
    return addHeapObject(ret);
});

export const __wbg_global_073eb4249a3a8c12 = handleError(function() {
    var ret = global.global;
    return addHeapObject(ret);
});

export const __wbindgen_is_undefined = function(arg0) {
    var ret = getObject(arg0) === undefined;
    return ret;
};

export const __wbg_buffer_985803c87989344b = function(arg0) {
    var ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export const __wbg_newwithbyteoffsetandlength_36d42f1c91e7259d = function(arg0, arg1, arg2) {
    var ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export const __wbg_new_b7e3d6adc8b9377a = function(arg0) {
    var ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export const __wbg_set_6db0a4cb6e322f85 = handleError(function(arg0, arg1, arg2) {
    var ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
});

export const __wbindgen_string_get = function(arg0, arg1) {
    const obj = getObject(arg1);
    var ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export const __wbindgen_debug_string = function(arg0, arg1) {
    var ret = debugString(getObject(arg1));
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export const __wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export const __wbindgen_rethrow = function(arg0) {
    throw takeObject(arg0);
};

export const __wbindgen_memory = function() {
    var ret = wasm.memory;
    return addHeapObject(ret);
};

export const __wbindgen_closure_wrapper778 = function(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 226, __wbg_adapter_30);
    return addHeapObject(ret);
};

