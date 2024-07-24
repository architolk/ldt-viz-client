import { instance } from "@viz-js/viz";
import {SparqlEndpointFetcher} from "fetch-sparql-endpoint";
import {RdfObjectLoader} from "rdf-object";
import * as endpointModule from "./endpoint.js";
import * as helperModule from "./helpers.js";

export async function displayTriples(canvas, query, params) {

  const graph = {
    graphAttributes: {
      rankdir: "LR",
      sep: "+20"
    },
    nodeAttributes: {
      shape: "circle"
    },
    edgeAttributes: {},
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
      case "all": displayProperties(myLoader.resources,graph); break;
      default: displayProperties(myLoader.resources,graph);
    }

    instance().then(viz => {
      const svg = viz.renderSVGElement(graph,{images: [{ name: "gen.svg", width: "40", height: "20" }]});

      if (params.notation == "all"){
       // Post-process the SVG to replace text labels with hyperlinks
       svg.querySelectorAll('.edge text').forEach(textElement => {
        const labelText = textElement.textContent;
        const svgNS = "http://www.w3.org/2000/svg";
        const xlinkNS = "http://www.w3.org/1999/xlink";
        
        // Create a new SVG 'a' element
        const svgLink = document.createElementNS(svgNS, "a");
        
        // Set the href to the actual URL
        const href = labelText.startsWith('http') ? labelText : `https://www.w3.org/TR/rdf-schema/#ch_${encodeURIComponent(labelText)}`;
        svgLink.setAttributeNS(xlinkNS, "xlink:href", href);
        
        // Set the link to open in a new tab
        svgLink.setAttribute("target", "_blank");
        
        // Copy positioning attributes from the original text element
        ['x', 'y', 'text-anchor', 'font-family', 'font-size'].forEach(attr => {
          if (textElement.hasAttribute(attr)) {
            svgLink.setAttribute(attr, textElement.getAttribute(attr));
          }
        });
        
        // Create a new text element inside the link
        const newText = document.createElementNS(svgNS, "text");
        newText.textContent = labelText;
        
        // Copy styles from the original text element
        const computedStyle = window.getComputedStyle(textElement);
        newText.style.fill = "blue"; // Make the text blue
        newText.style.textDecoration = "underline"; // Underline the text
        
        // Ensure the new text has the same positioning as the original
        ['x', 'y', 'text-anchor', 'font-family', 'font-size'].forEach(attr => {
          if (textElement.hasAttribute(attr)) {
            newText.setAttribute(attr, textElement.getAttribute(attr));
          }
        });
        
        // Append the new text to the link, and the link to the parent of the original text
        svgLink.appendChild(newText);
        textElement.parentNode.replaceChild(svgLink, textElement);
        
        // Add click event listener (optional)
        svgLink.addEventListener('click', (e) => {
          console.log("Clicked on edge label:", labelText);
          // If you want to prevent the default navigation, uncomment the next line
          // e.preventDefault();
        });
      });
      }

      const rect = canvas.getBoundingClientRect();
      const svgHeight = helperModule.pt2px(svg.getAttribute("height"));
      //const canvasHeight = helperModule.px2px(canvas.style.height);
      const canvasHeight = rect.height;
      const hScale = svgHeight/canvasHeight;
      const svgWidth = helperModule.pt2px(svg.getAttribute("width"));
      //const canvasWidth = helperModule.px2px(canvas.style.width);
      const canvasWidth = rect.width;
      const wScale = svgWidth/canvasWidth;
      const gScale = (hScale > wScale) ? hScale : wScale;
      svg.setAttribute("height",canvasHeight);
      svg.setAttribute("width",canvasWidth);
      canvas.appendChild(svg);

      const g = svg.getElementsByTagName('g')[0];
      g.setAttribute("data-scale",gScale);
      g.setAttribute("data-shrink",gScale);
      const bbox = g.getBBox();
      g.setAttribute("data-tx",-bbox.x);
      g.setAttribute("data-ty",-bbox.y);
      scaleGroup(g);
      svg.addEventListener('wheel', eventListenerWheel);
      svg.addEventListener('mousedown',eventListenerStartDrag);
      svg.addEventListener('mouseleave',eventListenerEndDrag);
      svg.addEventListener('mouseup',eventListenerEndDrag);
    });
  });
}

function eventListenerWheel(e) {
  e.preventDefault();
  const g = this.getElementsByTagName('g')[0];
  
  // Get the current scale
  let currentScale = parseFloat(g.getAttribute("data-scale"));
  
  // Calculate a zoom factor (adjust this value to change zoom sensitivity)
  const zoomFactor = 0.05;
  
  // Calculate the new scale
  let newScale = e.deltaY > 0 ? 
    currentScale * (1 - zoomFactor) : // Zoom out
    currentScale * (1 + zoomFactor);  // Zoom in
  
  // Limit the scale to a reasonable range (e.g., between 0.1 and 10)
  newScale = Math.max(0.1, Math.min(newScale, 10));
  
  // Set the new scale
  g.setAttribute("data-scale", newScale);
  
  // Apply the new scale
  scaleGroup(g);
}

function eventListenerDrag(e) {
  e.preventDefault();
  const g = this.getElementsByTagName('g')[0];
  const scale = g.getAttribute("data-shrink")/g.getAttribute("data-scale");
  const tx = 0.7*e.movementX*scale+1*g.getAttribute("data-tx");
  const ty = 0.7*e.movementY*scale+1*g.getAttribute("data-ty");
  g.setAttribute("data-tx",tx);
  g.setAttribute("data-ty",ty);
  scaleGroup(g);
}
function eventListenerStartDrag() {
  this.addEventListener('mousemove',eventListenerDrag);
}
function eventListenerEndDrag() {
  this.removeEventListener('mousemove',eventListenerDrag);
}

function scaleGroup(g) {
  const scale = g.getAttribute("data-scale");
  const tx = g.getAttribute("data-tx");
  const ty = g.getAttribute("data-ty");
  g.setAttribute("transform","scale("+scale+") rotate(0) translate("+tx+" "+ty+")");
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
                  graph.edges.push({tail: myResource.value, head: resource.value, attributes:{arrowhead: "onormal"}});
                  break;
                default:
                  graph.edges.push({tail: myResource.value, head: resource.value});
                  break;
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
  graph.graphAttributes.rankdir = "BT";
  graph.nodeAttributes.margin = 0;
  graph.edgeAttributes.dir = "both";
  const resourceURIs = Object.keys(_resources);
  resourceURIs.forEach((resourceURI) => {
    const myResource = _resources[resourceURI];
    const type = myResource.property.type;
    const label = myResource.property.label;
    if ((typeof type != "undefined") && (typeof label != "undefined")) {
      if (type.value=="urn:name:entity") {
        let htmlLabel = "<table border='0' cellborder='1' cellspacing='0' cellpadding='4' width='60'><tr><td bgcolor='lightblue'>"+label+"</td></tr>";
        for (const [property,resources] of Object.entries(myResource.propertiesUri)) {
          if (property=="urn:name:attribute") {
            for (const resource of resources) {
              var olabel = resource.property.label;
              if (typeof olabel != "undefined") {
                const otype = resource.property['urn:name:type'];
                if (typeof otype != "undefined") {
                  const otypelabel = otype.property.label;
                  if (typeof otypelabel != "undefined") {
                    olabel += ": " + otype.property.label;
                  }
                }
                const ocard = resource.property['urn:name:card'];
                if (typeof ocard != "undefined") {
                  olabel += " ["+ocard.value+"]";
                }
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
          var arrowhead = 'none';
          var arrowtail = 'none';
          const fromCard = myResource.property['urn:name:fromCard'];
          if (typeof fromCard != "undefined") {
            switch (fromCard.value) {
              case "0,1": arrowtail = 'noneodot'; break;
              case "1,1": arrowtail = 'noneotee'; break;
              case "0,n": arrowtail = 'crowodot'; break;
              case "1,n": arrowtail = 'crowotee'; break;
              default:
            }
          }
          const toCard = myResource.property['urn:name:toCard'];
          if (typeof toCard != "undefined") {
            switch (toCard.value) {
              case "0,1": arrowhead = 'noneodot'; break;
              case "1,1": arrowhead = 'noneotee'; break;
              case "0,n": arrowhead = 'crowodot'; break;
              case "1,n": arrowhead = 'crowotee'; break;
              default:
            }
          }
          const edge = {tail: src.value, head: dest.value, attributes:{constraint: "false", minlen: "3.0", label: label, arrowhead: arrowhead, arrowtail: arrowtail}};
          const fromRole = myResource.property['urn:name:fromRole'];
          if (typeof fromRole != "undefined") {
            edge.attributes.taillabel = fromRole.value
          }
          const toRole = myResource.property['urn:name:toRole'];
          if (typeof toRole != "undefined") {
            edge.attributes.headlabel = toRole.value
          }
          graph.edges.push(edge)
        }
      }
      if (type.value=="urn:name:classification") {
        const subclass = myResource.property['urn:name:subclass'];
        const superclass = myResource.property['urn:name:superclass'];
        graph.nodes.push({name: myResource.value, attributes: {shape: "none", width: 0, height: 0, margin: 0, image: "gen.svg"}});
        graph.edges.push({tail: subclass.value, head:myResource.value, attributes: {dir: 'none', weight: 20}});
        graph.edges.push({tail: myResource.value, head:superclass.value, attributes: {dir: 'LR'}});
      }
    }
  });
}
