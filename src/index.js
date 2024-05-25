import * as displayTriples from './displayTriples.js';
import * as endpointModule from "./endpoint.js";
//import * as test from './test.js';

//test.test();
endpointModule.setEndpoint("https://dbpedia.org/sparql");
displayTriples.displayTriples(document.getElementById("graph"),"construct {<http://dbpedia.org/ontology/Place> ?p ?o. ?o rdfs:label ?olabel} where {<http://dbpedia.org/ontology/Place> ?p ?o OPTIONAL {?o rdfs:label ?olabel}}");
