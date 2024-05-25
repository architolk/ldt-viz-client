import * as displayTriplesModule from './displayTriples.js';
import * as endpointModule from "./endpoint.js";

/*
import * as testModule from './test.js';
export function test() {
  testModule.test()
}
*/

export function setEndpoint(_endpoint) {
  endpointModule.setEndpoint(_endpoint)
}

export async function displayTriples(canvas, query, params) {
  displayTriplesModule.displayTriples(canvas, query, params)
}
