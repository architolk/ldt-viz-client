# ldt-viz-client
RDF client to create visual diagrams

## Running

```
git clone git@github.com:architolk/ldt-viz-client.git
cd ldt-viz-client
npm install
npm start
```

## Building

Change mode in `webpack.config.js` to 'production', and do:

```
npm run build
```

Copy all files from the [/dist](dist) folder (after the build is completed) to the webserver of your choice

## Usage

A construct query is required which is used to create the diagram. The triples will be transformed to a graphviz dot JSON object. The result is rendered by the graphviz engine into an SVG.

Via the params element, you can select the notation that is used. This notation corresponds to a particular transformation from triples into a graph diagram.

The [dist](/dist) folder contains a html file per notation, these can be used as examples.

### properties (default)
This is the most "clean" representation of a triples graph. The 'properties' notation creates a diagram in which any resource will be represented as a ellipse, any literal will be represented as a rectangle and any triple will be represented as a directed edge between an ellipse and another ellipse or rectangle.

### links
The 'links' notation creates a diagram in which any labelled resource (e.g. a resource with a rdfs:label triple) is represented as a resource and all triples from a labelled resource to another labelled resource is represented as a directed ldge between these resources.

### concepts
The 'concepts' notation creates a diagram in which skos:Concepts are represented and any relations between them. Other resources are ignored.

### shapes
The 'shapes' notation creates a diagram which resembles a UML notation of a shacl shapes graph.

### erd
The 'erd' notation creates an entity-relationship diagram.

## API

- displayTriples(DOMElement,query,params)
  - DOMElement: the DIV in which the graph will be presented (as a SVG element).
  - query: CONSTRUCT-query string. May contain parameters, like `@URI@`
  - params: JSON object containing parameters, for example: `{uri:'urn:foo'}`
    - the 'layout' parameter may contain the layout-engine of graphviz
    - the 'notation' parameter is used to specifiy the way triples are transformed in a particular graph notation style
