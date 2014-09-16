(function(context) {
    "use strict";

    var TheGraph = context.TheGraph;

    // PolymerGestures monkeypatch
    PolymerGestures.dispatcher.gestures.forEach(function(gesture) {
        // hold
        if (gesture.HOLD_DELAY) {
            gesture.HOLD_DELAY = 500;
        }
        // track
        if (gesture.WIGGLE_THRESHOLD) {
            gesture.WIGGLE_THRESHOLD = 8;
        }
    });

    // Node view
    TheGraph.Node = React.createClass({
        mixins: [TheGraph.mixins.Tooltip],
        componentDidMount: function() {
            // Dragging
            this.getDOMNode().addEventListener("trackstart", this.onTrackStart);

            // Tap to select
            if (this.props.onNodeSelection) {
                this.getDOMNode().addEventListener("tap", this.onNodeSelection, true);
            }

            this.getDOMNode().addEventListener("mouseenter", this.onMouseEnter, true);
            this.getDOMNode().addEventListener("mouseleave", this.onMouseLeave, true);

            // Context menu
            if (this.props.showContext) {
                this.getDOMNode().addEventListener("contextmenu", this.showContext);
                this.getDOMNode().addEventListener("hold", this.showContext);
            }

        },
        onMouseEnter: function(event) {
            document.fire("nodeEntered", this.props.node);
        },
        onMouseLeave: function(event) {
            document.fire("nodeLeft", this.props.node);
        },
        onNodeSelection: function(event) {
            console.log("onNodeSelection");

            document.fire("selectedNodesChanged", [this.props.node]);
            // Don't tap app (unselect)
            //event.stopPropagation();

            var toggle = (TheGraph.metaKeyPressed || event.pointerType === "touch");
            this.props.onNodeSelection(this.props.key, this.props.node, toggle);
        },
        onTrackStart: function(event) {
            console.log("the-graph-node onTrackStart()");
            // Don't drag graph
            event.stopPropagation();

            // Don't change selection
            event.preventTap();

            // Don't drag under menu
            if (this.props.app.menuShown) {
                return;
            }

            // Don't drag while pinching
            if (this.props.app.pinching) {
                return;
            }

            this.getDOMNode().addEventListener("track", this.onTrack);
            this.getDOMNode().addEventListener("trackend", this.onTrackEnd);

            // Moving a node should only be a single transaction
            if (this.props.export) {
                this.props.graph.startTransaction('moveexport');
            } else {
                this.props.graph.startTransaction('movenode');
            }
        },
        onTrack: function(event) {
//            console.log("onTrack");
            // Don't fire on graph
            event.stopPropagation();

            // Don't drag while pinching
            if (this.props.app.pinching) {
                return;
            }

            var scale = this.props.app.state.scale;
            var deltaX = Math.round(event.ddx / scale);
            var deltaY = Math.round(event.ddy / scale);

            // Fires a change event on noflo graph, which triggers redraw
            if (this.props.export) {
                var newPos = {
                    x: this.props.export.metadata.x + deltaX,
                    y: this.props.export.metadata.y + deltaY
                };
                if (this.props.isIn) {
                    this.props.graph.setInportMetadata(this.props.exportKey, newPos);
                } else {
                    this.props.graph.setOutportMetadata(this.props.exportKey, newPos);
                }
            } else {
                this.props.graph.setNodeMetadata(this.props.key, {
                    x: this.props.node.metadata.x + deltaX,
                    y: this.props.node.metadata.y + deltaY
                });
            }
        },
        onTrackEnd: function(event) {
            // Don't fire on graph
            event.stopPropagation();

            this.getDOMNode().removeEventListener("track", this.onTrack);
            this.getDOMNode().removeEventListener("trackend", this.onTrackEnd);

            // Snap to grid
            var snapToGrid = true;
            var snap = TheGraph.nodeSize / 2;
            if (snapToGrid) {
                var x, y;
                if (this.props.export) {
                    var newPos = {
                        x: Math.round(this.props.export.metadata.x / snap) * snap,
                        y: Math.round(this.props.export.metadata.y / snap) * snap
                    };
                    if (this.props.isIn) {
                        this.props.graph.setInportMetadata(this.props.exportKey, newPos);
                    } else {
                        this.props.graph.setOutportMetadata(this.props.exportKey, newPos);
                    }
                } else {
                    this.props.graph.setNodeMetadata(this.props.key, {
                        x: Math.round(this.props.node.metadata.x / snap) * snap,
                        y: Math.round(this.props.node.metadata.y / snap) * snap
                    });
                }
            }

            console.log("onTrackEnd of a node, update model");
            fmx.doc.tasks.set(this.props.key, this.props.graph.getNode(this.props.key));

            // Moving a node should only be a single transaction
            if (this.props.export) {
                this.props.graph.endTransaction('moveexport');
            } else {
                this.props.graph.endTransaction('movenode');
            }
        },
        showContext: function(event) {
            console.log("the-graph-node.js showContext()");
            // Don't show native context menu
            event.preventDefault();

            // Don't tap graph on hold event
            event.stopPropagation();
            if (event.preventTap) {
                event.preventTap();
            }

            // Get mouse position
            var x = event.x || event.clientX || 0;
            var y = event.y || event.clientY || 0;

            // App.showContext
            this.props.showContext({
                element: this,
                type: (this.props.export ? (this.props.isIn ? "graphInport" : "graphOutport") : "node"),
                x: x,
                y: y,
                graph: this.props.graph,
                itemKey: (this.props.export ? this.props.exportKey : this.props.key),
                item: (this.props.export ? this.props.export : this.props.node)
            });
        },
        getContext: function(menu, options, hide) {
            // If this node is an export
            if (this.props.export) {
                return TheGraph.Menu({
                    menu: menu,
                    options: options,
                    triggerHideContext: hide,
                    label: this.props.exportKey
                });
            }

            // Absolute position of node
            var x = options.x;
            var y = options.y;
            var scale = this.props.app.state.scale;
            var appX = this.props.app.state.x;
            var appY = this.props.app.state.y;
            var nodeX = (this.props.x + TheGraph.nodeSize / 2) * scale + appX;
            var nodeY = (this.props.y + TheGraph.nodeSize / 2) * scale + appY;
            var deltaX = nodeX - x;
            var deltaY = nodeY - y;
            var ports = this.props.ports;
            var processKey = this.props.key;
            var highlightPort = this.props.highlightPort;

            // If there is a preview edge started, only show connectable ports
            if (this.props.graphView.state.edgePreview) {
                if (this.props.graphView.state.edgePreview.isIn) {
                    // Show outputs
                    return TheGraph.NodeMenuPorts({
                        ports: ports.outports,
                        triggerHideContext: hide,
                        isIn: false,
                        scale: scale,
                        processKey: processKey,
                        deltaX: deltaX,
                        deltaY: deltaY,
                        translateX: x,
                        translateY: y,
                        highlightPort: highlightPort
                    });
                } else {
                    // Show inputs
                    return TheGraph.NodeMenuPorts({
                        ports: ports.inports,
                        triggerHideContext: hide,
                        isIn: true,
                        scale: scale,
                        processKey: processKey,
                        deltaX: deltaX,
                        deltaY: deltaY,
                        translateX: x,
                        translateY: y,
                        highlightPort: highlightPort
                    });
                }
            }

            // Default, show whole node menu
            return TheGraph.NodeMenu({
                menu: menu,
                options: options,
                triggerHideContext: hide,
                label: this.props.label,
                graph: this.props.graph,
                graphView: this.props.graphView,
                node: this,
                icon: this.props.icon,
                ports: ports,
                process: this.props.node,
                processKey: processKey,
                x: x,
                y: y,
                deltaX: deltaX,
                deltaY: deltaY,
                highlightPort: highlightPort
            });
        },
        getTooltipTrigger: function() {
            return this.getDOMNode();
        },
        shouldShowTooltip: function() {
            return (this.props.app.state.scale < TheGraph.zbpNormal);
        },
        shouldComponentUpdate: function(nextProps, nextState) {
            // Only rerender if changed
            return (nextProps.x !== this.props.x || nextProps.y !== this.props.y || nextProps.icon !== this.props.icon || nextProps.label !== this.props.label || nextProps.sublabel !== this.props.sublabel || nextProps.ports !== this.props.ports || nextProps.selected !== this.props.selected || nextProps.highlightPort !== this.props.highlightPort || nextProps.ports.dirty
                    );
        },
        componentDidUpdate: function(prevProps, prevState) {
            // HACK to change SVG class https://github.com/facebook/react/issues/1139
            var groupClass = "node drag" + (this.props.selected ? " selected" : "");
            this.getDOMNode().setAttribute("class", groupClass);
        },
        render: function() {
            if (this.props.ports.dirty) {
                // This tag is set when an edge or iip changes port colors
                this.props.ports.dirty = false;
            }

            var label = this.props.label;
            var sublabel = this.props.sublabel;
            if (!sublabel || sublabel === label) {
                sublabel = "";
            }
            var x = this.props.x;
            var y = this.props.y;

            // Ports
            var keys, count, maxCount;
            var processKey = this.props.key;
            var app = this.props.app;
            var graph = this.props.graph;
            var isExport = (this.props.export !== undefined);
            var showContext = this.props.showContext;
            var highlightPort = this.props.highlightPort;

            // Inports
            var inports = this.props.ports.inports;
            keys = Object.keys(inports);
            count = keys.length;
            maxCount = count;
            // Make views
            var inportViews = keys.map(function(key) {
                var info = inports[key];
                var props = {
                    app: app,
                    graph: graph,
                    key: processKey + ".in." + info.label,
                    label: info.label,
                    processKey: processKey,
                    isIn: true,
                    isExport: isExport,
                    nodeX: x,
                    nodeY: y,
                    x: info.x,
                    y: info.y,
                    port: {
                        process: processKey,
                        port: info.label,
                        type: info.type
                    },
                    highlightPort: highlightPort,
                    route: info.route,
                    showContext: showContext
                };
                return TheGraph.Port(props);
            });

            // Outports
            var outports = this.props.ports.outports;
            keys = Object.keys(outports);
            count = keys.length;
            if (maxCount < count) {
                maxCount = count;
            }
            var outportViews = keys.map(function(key) {
                var info = outports[key];
                var props = {
                    app: app,
                    graph: graph,
                    key: processKey + ".out." + info.label,
                    label: info.label,
                    processKey: processKey,
                    isIn: false,
                    isExport: isExport,
                    nodeX: x,
                    nodeY: y,
                    x: info.x,
                    y: info.y,
                    port: {
                        process: processKey,
                        port: info.label,
                        type: info.type
                    },
                    highlightPort: highlightPort,
                    route: info.route,
                    showContext: showContext
                };
                return TheGraph.Port(props);
            });

            // Make sure icon exists
            var icon = TheGraph.FONT_AWESOME[this.props.icon];
            if (!icon) {
                icon = null;
            }

            return (
                    React.DOM.g({
                        className: "node drag", // See componentDidUpdate
                        name: this.props.key,
                        key: this.props.key,
                        title: label,
                        transform: "translate(" + x + "," + y + ")"
                    }, React.DOM.rect({// this is invisible, just for dragging
                        className: "node-bg", // HACK to make the whole g draggable
                        width: TheGraph.nodeWidth,
                        height: TheGraph.nodeHeaderHeight * 1.5 + maxCount * 10
                    }), React.DOM.rect({
                        className: "node-border drag",
                        width: TheGraph.nodeWidth,
                        height: TheGraph.nodeHeaderHeight * 1.5 + maxCount * 10,
                        rx: TheGraph.nodeRadius,
                        ry: TheGraph.nodeRadius
                    }), React.DOM.rect({
                        className: "node-rect drag",
                        width: TheGraph.nodeWidth - 6,
                        height: TheGraph.nodeHeaderHeight * 1.5 - 6 + maxCount * 10,
                        x: 3,
                        y: 3,
                        rx: TheGraph.nodeRadius - 2,
                        ry: TheGraph.nodeRadius - 2
                    }), React.DOM.text({
                        ref: "icon",
                        className: "icon node-icon drag",
                        x: TheGraph.nodeSize / 2,
                        y: TheGraph.nodeSize / 2,
                        children: icon
                    }), React.DOM.g({
                        className: "inports",
                        children: inportViews
                    }), React.DOM.g({
                        className: "outports",
                        children: outportViews
                    }), TheGraph.TextBG({
                        className: "node-label-bg",
                        textClassName: "node-label",
                        height: 12,
                        halign: "center",
                        x: TheGraph.nodeWidth / 2,
                        y: TheGraph.nodeHeaderHeight / 2,
                        text: label
                    }))
                    );
        }
    });

})(this);
