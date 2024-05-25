import { instance } from "@viz-js/viz";
import {SparqlEndpointFetcher} from "fetch-sparql-endpoint";
import {RdfObjectLoader} from "rdf-object";
import * as endpointModule from "./endpoint.js";
import * as helperModule from "./helpers.js";

export async function displayTriples(canvas, query, params) {

  const graph = {
    graphAttributes: {
      rankdir: "LR"
    },
    nodeAttributes: {
      shape: "circle"
    },
    nodes: [],
    edges: []
  }

  const context = {
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
    'type': 'rdf:type',
    'label': 'rdfs:label',
  };
  const myLoader = new RdfObjectLoader({ context });

  const myFetcher = new SparqlEndpointFetcher();
  const tripleStream = await myFetcher.fetchTriples(endpointModule.getEndpoint(), helperModule.replace(query,params));

  await myLoader.import(tripleStream).then(() => {

    const resourceURIs = Object.keys(myLoader.resources);
    resourceURIs.forEach((resourceURI) => {
      const myResource = myLoader.resources[resourceURI];
      const label = myResource.property.label;
      if (typeof label != "undefined") {
        //This resource has a label, so is a subject in the triple stream, WITH a label
        graph.nodes.push({name: myResource.value, attributes:{label: label.value}});
        myResource.predicates.forEach((predicate) => {
          for (const pobject of myResource.properties[predicate]) {
            const olabel = pobject.property.label;
            if (typeof olabel != "undefined") {
              //This object also has a label, so we can safely draw an edge (as it will be drawn as a node)
              graph.edges.push({tail: myResource.value, head: pobject.value, attributes:{label: helperModule.uri2label(predicate.value)}});
            }
          }
        });
      }
    });

    console.log(graph);

    instance().then(viz => {
      const svg = viz.renderSVGElement(graph);
      canvas.appendChild(svg);
    });
  });
}
