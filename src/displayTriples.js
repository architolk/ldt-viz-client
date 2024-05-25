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
  if (typeof params.layout != "undefined") {
    graph.graphAttributes.layout = params.layout
  }

  const context = {
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
    'sh': 'http://www.w3.org/ns/shacl#',
    'type': 'rdf:type',
    'label': 'rdfs:label',
    'comment': 'rdfs:comment'
  };
  const myLoader = new RdfObjectLoader({ context });

  const myFetcher = new SparqlEndpointFetcher();
  const tripleStream = await myFetcher.fetchTriples(endpointModule.getEndpoint(), helperModule.replace(query,params));

  await myLoader.import(tripleStream).then(() => {

    switch (params.notation) {
      case "links": displayLinks(myLoader.resources,graph); break;
      case "concepts": displayConcepts(myLoader.resources,graph); break;
      case "shapes": displayShapes(myLoader.resources,graph); break;
      case "erd": displayERD(myLoader.resources,graph); break;
      default: displayProperties(myLoader.resources,graph);
    }

    instance().then(viz => {
      const svg = viz.renderSVGElement(graph);
      canvas.appendChild(svg);
    });
  });
}

// Display function:
// - displays all linked resources with a label
//
function displayLinks(_resources, graph) {
  const resourceURIs = Object.keys(_resources);
  resourceURIs.forEach((resourceURI) => {
    const myResource = _resources[resourceURI];
    const label = myResource.property.label;
    if (typeof label != "undefined") {
      //This resource has a label, so is a subject in the triple stream, WITH a label
      graph.nodes.push({name: myResource.value, attributes:{label: label.value}});
      for (const [property,resources] of Object.entries(myResource.propertiesUri)) {
        for (const resource of resources) {
          const olabel = resource.property.label;
          if (typeof olabel != "undefined") {
            //This object also has a label, so we can safely draw an edge (as it will be drawn as a node)
            graph.edges.push({tail: myResource.value, head: resource.value, attributes:{label: helperModule.uri2label(property)}});
          }
        }
      }
    }
  })
}

// Display function:
// - displays all properties
//
function displayProperties(_resources, graph) {
  const resourceURIs = Object.keys(_resources);
  resourceURIs.forEach((resourceURI) => {
    const myResource = _resources[resourceURI];
    if (myResource.predicates.length>0) {
      //Only process resources that are subject in a triple
      graph.nodes.push({name: myResource.value, attributes:{shape: "ellipse"}});
      for (const [property,resources] of Object.entries(myResource.propertiesUri)) {
        for (const resource of resources) {
          switch (resource.type) {
            case "NamedNode":
              graph.nodes.push({name: resource.value, attributes:{shape: "ellipse"}}); //This is overkill if object = subject, but this id corrected by viz itself
              graph.edges.push({tail: myResource.value, head: resource.value, attributes:{label: property}});
              break;
            case "Literal":
              graph.nodes.push({name: resource.value, attributes:{shape: "box"}});
              graph.edges.push({tail: myResource.value, head: resource.value, attributes:{label: property}});
            default:
          }
        }
      }
    }
  })
}

// Display function:
// - displays concepts (definition + relations)
//
function displayConcepts(_resources, graph) {
  graph.nodeAttributes.shape = "none";
  graph.nodeAttributes.margin = 0;
  const resourceURIs = Object.keys(_resources);
  resourceURIs.forEach((resourceURI) => {
    const myResource = _resources[resourceURI];
    const type = myResource.property.type;
    const label = myResource.property.label;
    if ((typeof type != "undefined") && (typeof label != "undefined")) {
      if (type.value=="http://www.w3.org/2004/02/skos/core#Concept") {
        const desc = (typeof myResource.property.comment == 'undefined' ? "" : myResource.property.comment);
        const htmlLabel = "<table border='1' cellborder='0' style='rounded'><tr><td>"+label+"</td></tr><hr/><tr><td>"+desc+"</td></tr></table>";
        graph.nodes.push({name: myResource.value, attributes:{label: {html: htmlLabel}}});
        for (const [property,resources] of Object.entries(myResource.propertiesUri)) {
          for (const resource of resources) {
            const otype = resource.property.type;
            const olabel = resource.property.label;
            if ((typeof otype != "undefined") && (typeof olabel != "undefined")) {
              switch (property) {
                case "http://www.w3.org/2004/02/skos/core#broader":
                  graph.edges.push({tail: myResource.value, head: resource.value, attributes:{label: "skos:broader"}});
                  break;
                default:
              }
            }
          }
        }
      }
    }
  });
}

function displayShapes(_resources, graph) {
  graph.nodeAttributes.shape = "none";
  graph.nodeAttributes.margin = 0;
  const resourceURIs = Object.keys(_resources);
  resourceURIs.forEach((resourceURI) => {
    const myResource = _resources[resourceURI];
    const type = myResource.property.type;
    const label = myResource.property.label;
    if ((typeof type != "undefined") && (typeof label != "undefined")) {
      if (type.value=="http://www.w3.org/ns/shacl#NodeShape") {
        let htmlLabel = "<table border='0' cellborder='1' cellspacing='0' cellpadding='4'><tr><td bgcolor='lightblue'>"+label+"</td></tr>";
        for (const [property,resources] of Object.entries(myResource.propertiesUri)) {
          if (property=="http://www.w3.org/ns/shacl#property") {
            let portnr = 0;
            for (const resource of resources) {
              const olabel = resource.property.label;
              if (typeof olabel != "undefined") {
                htmlLabel += "<tr><td align='left' port='p"+portnr+"'>" + olabel + "</td></tr>";
              }
              const onode = resource.property['sh:node'];
              if (typeof onode != "undefined") {
                graph.edges.push({tail: myResource.value, head: onode.value, attributes:{tailport: "p"+portnr}});
              }
              portnr++;
            }
          }
        }
        htmlLabel += "</table>";
        graph.nodes.push({name: myResource.value, attributes:{label: {html: htmlLabel}}});
      }
    }
  });
}

function displayERD(_resources, graph) {
  graph.nodeAttributes.shape = "none";
  graph.nodeAttributes.margin = 0;
  const resourceURIs = Object.keys(_resources);
  resourceURIs.forEach((resourceURI) => {
    const myResource = _resources[resourceURI];
    const type = myResource.property.type;
    const label = myResource.property.label;
    if ((typeof type != "undefined") && (typeof label != "undefined")) {
      if (type.value=="urn:name:entity") {
        let htmlLabel = "<table border='0' cellborder='1' cellspacing='0' cellpadding='4'><tr><td bgcolor='lightblue'>"+label+"</td></tr>";
        for (const [property,resources] of Object.entries(myResource.propertiesUri)) {
          if (property=="urn:name:attribute") {
            for (const resource of resources) {
              const olabel = resource.property.label;
              if (typeof olabel != "undefined") {
                htmlLabel += "<tr><td align='left'>" + olabel + "</td></tr>";
              }
            }
          }
        }
        htmlLabel += "</table>";
        graph.nodes.push({name: myResource.value, attributes:{label: {html: htmlLabel}}});
      }
      if (type.value=="urn:name:relationship") {
        const src = myResource.property['urn:name:from'];
        const dest = myResource.property['urn:name:to'];
        if ((typeof src != "undefined") && (typeof dest != "undefined")) {
          graph.edges.push({tail: src.value, head: dest.value, attributes:{label: label}})
        }
      }
    }
  });
}
