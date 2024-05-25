import * as displayTriples from './displayTriples.js';
import * as endpointModule from "./endpoint.js";
//import * as test from './test.js';

//test.test();
endpointModule.setEndpoint("https://dbpedia.org/sparql");
const query = "construct {<@URI@> ?p ?o. ?o rdfs:label ?olabel} where {<@URI@> ?p ?o OPTIONAL {?o rdfs:label ?olabel}}";
displayTriples.displayTriples(document.getElementById("graph"),query, {uri: "http://dbpedia.org/ontology/Place"});
