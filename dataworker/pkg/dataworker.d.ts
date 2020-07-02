/* tslint:disable */
/* eslint-disable */
/**
*/
export enum Filetype {
  CSV,
  JSON,
}
/**
*/
export class Chunk {
  free(): void;
/**
* @param {string} url 
* @param {string} text 
* @param {number} filetype 
* @returns {Chunk} 
*/
  static new(url: string, text: string, filetype: number): Chunk;
/**
* @returns {number} 
*/
  length(): number;
/**
* @returns {number} 
*/
  count(): number;
/**
* @returns {number} 
*/
  data(): number;
/**
* @returns {number} 
*/
  min(): number;
/**
* @returns {number} 
*/
  max(): number;
/**
* @returns {number} 
*/
  sum(): number;
/**
* @returns {number} 
*/
  avg(): number;
/**
* @returns {any} 
*/
  keys(): any;
/**
* @param {number} value 
* @returns {number} 
*/
  transform(value: number): number;
/**
* @param {Uint32Array} sort 
* @returns {Uint32Array} 
*/
  sort(sort: Uint32Array): Uint32Array;
/**
* @param {string} key 
* @returns {number} 
*/
  expose_key_int(key: string): number;
/**
* @param {string} key 
* @returns {number} 
*/
  expose_key_float(key: string): number;
/**
* @param {string} key 
* @returns {number} 
*/
  expose_key_string(key: string): number;
/**
* @returns {any} 
*/
  to_object(): any;
/**
* @param {number} index 
*/
  select(index: number): void;
}
/**
*/
export class Dataworker {
  free(): void;
/**
* @param {string} url 
* @param {number} filetype 
* @returns {any} 
*/
  static getData(url: string, filetype: number): any;
/**
* @param {string} url 
* @param {number} filetype 
* @param {Chunk} chunk 
* @returns {any} 
*/
  static append(url: string, filetype: number, chunk: Chunk): any;
}
