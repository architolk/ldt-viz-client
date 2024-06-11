import { instance } from "@viz-js/viz";

export function test() {
  instance().then(viz => {
    const graph = {
      graphAttributes: {
        rankdir: "LR",
      },
      edgeAttributes: {
        dir: "both",
        minlen: 3.0
      },
      nodes: [
        {name: "Article"},
        {name: "Comment"}
      ],
      edges: [
        {head: "Article", tail: "Comment", attributes: {label: "test", headlabel: "head", taillabel: "tail", arrowhead: "crowodot", arrowtail: "none"}}
      ]
    }
    const graph1 = {
      graphAttributes: {
        rankdir: "LR"
      },
      nodeAttributes: {
        shape: "circle"
      },
      nodes: [
        { name: "a", attributes: { label: { html: "<i>A</i>" }, color: "red" } },
        { name: "b", attributes: { label: { html: "<b>A</b>" }, color: "green" } }
      ],
      edges: [
        { tail: "a", head: "b", attributes: { label: "1" } },
        { tail: "b", head: "c", attributes: { label: "2", headport: "name" } }
      ],
      subgraphs: [
        {
          name: "cluster_1",
          nodes: [
            {
              name: "c",
              attributes: {
                label: {
                  html: "<table><tr><td>test</td><td port=\"name\">C</td></tr></table>"
                }
              }
            }
          ]
        }
      ]
    }
    const graph2 = {
      graphAttributes: {
        rankdir: "LR"
      },
      edgeAttributes: {
        dir: "both",
        minlen: 3.0
      },
      nodeAttributes: {
        shape: "none", margin: 0
      },
      nodes: [
        {name: "Article", attributes: {label: {html: '<table border="0" cellborder="1" cellspacing="0" cellpadding="4">\
            <tr><td bgcolor="lightblue">Article</td></tr>\
            <tr><td align="left">id: int(11)</td></tr>\
            <tr><td align="left">author: int(11)</td></tr>\
            <tr><td align="left">title: varchar(255)</td></tr>\
            <tr><td align="left">content: longtext</td></tr>\
            <tr><td align="left">created: datetime</td></tr>\
            <tr><td align="left">modified: datetime</td></tr>\
          </table>'}}
        },
        {name: "Comment", attributes: {label: {html: '<table border="0" cellborder="1" cellspacing="0" cellpadding="4">\
          <tr><td bgcolor="lightblue">Comment</td></tr>\
          <tr><td align="left">id: int(11)</td></tr>\
          <tr><td align="left">author: int(11)</td></tr>\
          <tr><td align="left">content: longtext</td></tr>\
          <tr><td align="left">created: datetime</td></tr>\
          <tr><td align="left">modified: datetime</td></tr>\
          </table>'}}
        }
      ],
      edges: [
        {head: "Article", tail: "Comment", attributes: {label: "test", headlabel: "head", taillabel: "tail", arrowhead: "crowodot", arrowtail: "none"}}
      ]
    }
    const graph3 = {
      edgeAttributes: {
        dir: "both"
      },
      nodeAttributes: {
        shape: "none", margin: 0
      },
      nodes: [
        {name: "a", attributes: {label: {html: "<table border='1' cellborder='0' style='rounded'><tr><td>begrip</td></tr><hr/><tr><td>de uitleg van het begrip</td></tr></table>"}}},
        {name: "b", attributes: {label: {html: "oifjwl laiwje fl"}}}
      ]
    }
    const graph4 = {
      graphAttributes: {
        rankdir: "BT"
      },
      nodes: [
        {name: "Vehicle", attributes: {label: "Vehicle"}},
        {name: "isa", attributes: {label: "x", shape: "none", width: 0, height: 0, margin: 0, image: "gen.svg"}},
        {name: "Bicycle", attributes: {label: "Bicycle"}},
        {name: "Car", attributes: {label: "Car"}}
      ],
      edges: [
        {head: "Vehicle", tail: "isa", attributes: {label: "is a"}},
        {head: "isa", tail: "Bicycle", attributes: {dir: "none"}},
        {head: "isa", tail: "Car", attributes: {dir: "none"}}
      ]
    }

    const svg = viz.renderSVGElement(graph4,{images: [{ name: "gen.svg", width: "40", height: "20" }]});

    document.getElementById("graph").appendChild(svg);

  });
}
