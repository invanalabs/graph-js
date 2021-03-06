import React from 'react';
import DefaultLayout from "../../layout/default";
import {Row, Nav} from "react-bootstrap";
import MenuComponent from "../../ui-components/menu";
import CanvasComponent from "../../ui-components/canvas";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faCamera,
    faQuestionCircle,
    faSync,
    faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "../../ui-components/sidebar";
import MainContent from "../../ui-components/main-content";
import ForceDirectedGraphCanvas from "../../interface/canvas/canvas";
import DataSidebarViewlet from "../../viewlets/data-management/data-sidebar";
import VisJsGraphCanvasUtils from "./canvas-utils";
import Button from "react-bootstrap/Button";
import CanvasController from "../../interface/canvas/canvas-ctrl";
import NodeMenu from "../../interface/node-menu";
import FocusedNodesList from "../../interface/focused-nodes-list";
// import LeftContainer from "../../viewlets/left-container";
import QueryConsole from "../../viewlets/query-console";
import ElementOptions from "../../viewlets/element-options";
import LoadingDiv from "../../viewlets/loading";
import {GRAPH_CANVAS_SETTINGS} from "../../../settings";
import RoutableRemoteEngine from "../../layout/routable-remote";
import ModalContainer from "../../ui-components/modal-container";
import Learn from "../../viewlets/support/Learn";
import RightContainer from "../../ui-components/right-container";
import {getAllNodeShapes, invertColor} from "../../interface/utils";
// import {setElementColorOptionsToStorage} from "../../utils";

export default class ExplorerView extends RoutableRemoteEngine {

    constructor(props) {
        // super(props);
        super(props);
        // super.constructor(props);
        this.state = {
            ...this.state,
            statusCode: null,
            nodes: [],
            edges: [],
            nodeGroups: {},
            edgeGroups: {},
            resetVisualizer: false,
            selectedElementData: null,
            focusedNodes: [],

            menuPositionX: null,
            menuPositionY: null,


            isRenderingCanvas: null

        }
        this.canvasUtils = new VisJsGraphCanvasUtils();
        this.canvasCtrl = null;
        this.network = null;
        this.child = React.createRef();
    }


    getNodeColor(node) {
        const allNodeShapes = getAllNodeShapes();

        if (allNodeShapes['inLabelShapes'].includes(node.shape)) {
            console.log("finding ", node._label, this.canvasUtils.getNodeColorObject(node._label));
            return invertColor(this.canvasUtils.getNodeColorObject(node._label).background,
                true);
        }
        return GRAPH_CANVAS_SETTINGS.DefaultElementTextColor

    }

    selectNodesInNetwork(selectedNodes) {

        console.log("===selectedNodes", selectedNodes);
        const allNodes = this.network.body.data.nodes;
        const allEdges = this.network.body.data.edges;
        let _this = this;
        if (selectedNodes.length === 0) {
            const allNodesOptions = allNodes.map(node => ({
                id: node.id,
                opacity: 1,
                color: _this.canvasUtils.getNodeColorObject(
                    node._label
                ),
                borderWidth: 2,
                font: {
                    color: _this.getNodeColor(node)
                }
            }));
            const allEdgesOptions = allEdges.map(edge => ({
                id: edge.id,
                opacity: 1,
                font: {color: GRAPH_CANVAS_SETTINGS.DefaultElementTextColor},
                color: _this.canvasUtils.getEdgeColorObject(edge._label)

            }));

            this.network.body.data.nodes.update(allNodesOptions)
            this.network.body.data.edges.update(allEdgesOptions)

        } else {

            // set all the nodes and edges opacity to 0.2
            // set selected nodes and edges opacity to 1.0
            const allNodesOptions = allNodes.map(node => ({
                id: node.id,
                // opacity: 0.3,
                borderWidth: 2,
                color: _this.canvasUtils.getNodeColorUnHighlightObject(
                    node._label
                ),
                font: {
                    color: invertColor(_this.canvasUtils.getNodeColorUnHighlightObject(node._label).background, true)
                }
            }));

            let selectedNodeIds = [];
            selectedNodes.forEach((node) => {
                selectedNodeIds.push(..._this.network.getConnectedNodes(node.id));
                selectedNodeIds.push(node.id);
            })

            selectedNodeIds = [...new Set(selectedNodeIds)];
            const selectedNodesOptions = selectedNodeIds.map(nodeId => ({
                id: nodeId,
                // opacity: 1,
                borderWidth: 4,
                color: _this.canvasUtils.getNodeColorObject(
                    _this.network.body.data.nodes.get(nodeId)._label
                ),
                font: {
                    color: _this.getNodeColor(_this.network.body.data.nodes.get(nodeId))
                }
            }));

            console.log("allNodesOptions", allNodesOptions);
            this.network.body.data.nodes.update(allNodesOptions)
            this.network.body.data.nodes.update(selectedNodesOptions)

            // set all the nodes and edges opacity to 0.2
            // set selected nodes and edges opacity to 1.0
            // Note: opacity doesnt work on edges.
            console.log("=====allEdges", allEdges);
            const allEdgesOptions = allEdges.map(edge => ({
                id: edge.id,
                opacity: 0.4,
                font: {color: GRAPH_CANVAS_SETTINGS.DefaultElementUnHighlightColor},
                color: _this.canvasUtils.getEdgeColorUnHighlightObject(edge._label)
            }));
            console.log("===allEdgesOptions", allEdgesOptions);
            let selectedEdgeIds = [];
            selectedNodes.forEach((node) => {
                selectedEdgeIds.push(..._this.network.getConnectedEdges(node.id));
            })
            console.log("==selectedEdgeIds", selectedEdgeIds);
            selectedEdgeIds = [...new Set(selectedEdgeIds)];

            let selectedEdgesOptions = [];
            selectedEdgeIds.forEach((edgeId) => {
                    const edge = this.network.body.data.edges.get(edgeId);
                    selectedEdgesOptions.push({
                        id: edgeId,
                        opacity: 1,
                        font: {color: GRAPH_CANVAS_SETTINGS.DefaultElementTextColor},
                        color: _this.canvasUtils.getEdgeColorObject(edge._label)
                    })
                }
            );
            // this.network.setOptions({nodes: {opacity: 0.1}});
            console.log("selectedEdgesOptions", selectedEdgesOptions)
            this.network.body.data.edges.update(allEdgesOptions)
            this.network.body.data.edges.update(selectedEdgesOptions)
            this.network.selectNodes(selectedNodeIds);
        }
    }

    addNodeToFocusedNodes(node) {
        console.log("addNodeToFocusedNodes", node);

        let existingFocusedNodes = this.state.focusedNodes;

        if (existingFocusedNodes.length > 0) {
            // TODO - redo this block ; may need performance improvements !
            existingFocusedNodes.push(node);

            const focusedNodes = [];
            const map = new Map();
            for (const item of existingFocusedNodes) {
                if (!map.has(item.id)) {
                    map.set(item.id, true);    // set any value to Map
                    focusedNodes.push(item);
                }
            }


            this.setState({focusedNodes: focusedNodes});
            this.selectNodesInNetwork(focusedNodes);
        } else {
            this.setState({focusedNodes: [node]});
            this.selectNodesInNetwork([node]);
        }
    }

    getFocusedNodes() {
        return this.state.focusedNodes;
    }

    makeQuery(queryObj, queryOptions) {
        this.setState({selectedElementData: null});
        return super.makeQuery(queryObj, queryOptions)
    }

    setSelectedElementData(selectedDataId, selectedElementType) {
        console.log("setSelectedElementData", selectedDataId, selectedElementType);
        let selectedElementData = null;
        if (selectedElementType === "g:Vertex") {
            selectedElementData = this.network.body.data.nodes.get(selectedDataId)
        } else if (selectedElementType === "g:Edge") {
            selectedElementData = this.network.body.data.edges.get(selectedDataId)
        }
        this.setState({selectedElementData: selectedElementData});
    }

    reRenderVisualizer() {
        console.log("reRenderVisualizer")

        const nodesPrepared = this.canvasUtils.prepareNodes(this.network.body.data.nodes);
        const edgesPrepared = this.canvasUtils.prepareEdges(this.network.body.data.edges);

        this.network.body.data.nodes.update(nodesPrepared)
        this.network.body.data.edges.update(edgesPrepared)
        this.setState({
            nodes: nodesPrepared, edges: edgesPrepared
        });
    }

    flushDataState() {
        this.setState({nodes: [], edges: [], selectedElementData: null, focusedNodes: []});
        this.network.setData({nodes: [], edges: []});
    }

    setNetwork(network) {
        network.on("stabilizationIterationsDone", function () {
            console.log("stabilizationIterationsDone");
            network.setOptions({physics: false});
        });

        this.network = network;

        this.canvasCtrl = new CanvasController(
            this.network,
            this.setStatusMessage.bind(this),
            this.flushDataState.bind(this),
            this.reRenderVisualizer.bind(this)
        );
    }

    getNetwork() {
        return this.network;
    }

    separateNodesAndEdges(data) {
        let nodes = [];
        let edges = [];
        data.forEach((datum) => {
            if (datum.type === "g:Edge") {
                edges.push(datum);
            } else if (datum.type === "g:Vertex") {
                nodes.push(datum);
            }
        })
        return {nodes, edges};
    }


    processResponse(response) {
        console.log("processResponse", response, this.state.queryObject);
        const lastResponse = response.getResponseResult();
        console.log("lastResponse", lastResponse);
        const data = response.getResponseResult(this.state.queryObject.queryKey);
        // separate nodes and edges
        if (lastResponse) {
            const {nodes, edges} = this.separateNodesAndEdges(data);
            this.addNewData(nodes, edges);
            this.setState({statusCode: response.transporterStatusCode})
        }
    }

    //
    // saveGroupsConfigToStorage(groups) {
    //     for (let group in groups) {
    //         setElementColorOptionsToStorage(groups[group]);
    //     }
    // }

    addNewData(newNodes, newEdges) {
        // const id = data.nodes.length + 1;
        console.log("addNewData", newNodes);

        const {newNodesToAdd, newEdgesToAdd} = this.canvasCtrl.getNewDataToAdd(
            newNodes, newEdges
        );

        const nodes = this.canvasUtils.prepareNodes(newNodesToAdd);
        const edges = this.canvasUtils.prepareEdges(newEdgesToAdd);

        // const nodeGroups = this.canvasUtils.nodeGroups;
        // const edgeGroups = this.canvasUtils.edgeGroups;

        // add the groups to localStorage
        // this.saveGroupsConfigToStorage(this.canvasUtils.nodeGroups);
        // this.saveGroupsConfigToStorage(this.canvasUtils.edgeGroups);

        this.network.setOptions({
            groups: {
                useDefaultGroups: false,
                // ...nodeGroups,
                // ...edgeGroups
            }
        });
        console.log("======, nodes", nodes);
        console.log("======, edges", edges);
        console.log(" ...this.canvasUtils.edgeGroups", this.canvasUtils.edgeGroups);
        // this.network.body.data.nodes.clear();
        // this.network.body.data.edges.clear();
        this.network.body.data.nodes.add(nodes);
        this.network.body.data.edges.add(edges);

        console.log("this.this.network", this.network);

        this.setState({
            nodes: [...nodes, ...this.state.nodes],
            edges: [...edges, ...this.state.edges]
        });

        this.startRenderingStatus();

    }


    onItemClick(labelName, labelType) {
        let queryPayload = {};
        if (labelType === "vertex") {
            queryPayload = this.connector.requestBuilder.filterVertexAndNeighborEdgesAndVertices(null, labelName, 10, 0);
        } else {
            queryPayload = this.connector.requestBuilder.filterEdgeAndGetNeighborVertices(labelName, 10, 0);
        }

        const queryPayloadCleaned = this.connector.requestBuilder.combineQueries(queryPayload, null);
        this.makeQuery(queryPayloadCleaned);
        // this.makeQuery()
    }


    removeFocusedNode(nodeId) {
        //

        let focusedNodes = this.state.focusedNodes
        let indexId = null
        focusedNodes.forEach((focusedNode, index) => {
            if (focusedNode.id === nodeId) {
                indexId = index
                return index;
            }
        });
        focusedNodes.splice(indexId, 1);
        console.log("===indexId", indexId);
        console.log("focusedNodes removed", focusedNodes);
        this.selectNodesInNetwork(focusedNodes);
        this.setState({focusedNodes: focusedNodes});

    }

    startRenderingStatus() {
        this.setState({isRenderingCanvas: true});
        this.setStatusMessage("Rendering the Graph.");
    }

    onRenderingStatusEnded() {
        this.setState({isRenderingCanvas: false});
        this.setStatusMessage("Rendered the Graph.");
        // this.network.redraw();
        // this.network.setOptions({physics: {enabled:false}});

    }

    setNodeMenuPosition(x, y) {
        this.setState({
            menuPositionX: x,
            menuPositionY: y
        })
    }

    componentDidMount() {
        super.componentDidMount();
        this.setStatusMessage("Hello World!");

    }

    render() {
        let _this = this;
        return (
            <DefaultLayout {...this.props} ref={this.child}
                           setModalContentName={this.setModalContentName.bind(this)}
                           setShowQueryConsole={this.setShowQueryConsole.bind(this)}>
                {super.render()}
                <Row>
                    <Sidebar>
                        <DataSidebarViewlet
                            onItemClick={this.onItemClick.bind(this)}
                            dataStore={this.dataStore}
                        />
                    </Sidebar>
                    <MainContent className={"main-content"}>
                        <MenuComponent className={" bg-light border-bottom"}>
                            <Nav className="mr-auto">
                                {/*<Nav.Item>*/}
                                {/*    <Nav.Link>*/}
                                {/*        Graph Canvas*/}
                                {/*    </Nav.Link>*/}
                                {/*</Nav.Item>*/}
                                <Nav.Item>
                                    <Button size={"sm"} variant={"link"}
                                            onClick={() => this.canvasCtrl.confirmRedrawCanvas()}
                                    >
                                        <FontAwesomeIcon icon={faSync}/>
                                    </Button>
                                </Nav.Item>
                                <Nav.Item>
                                    <Button size={"sm"} variant={"link"}
                                            onClick={() => this.canvasCtrl.downloadCanvasImage()}
                                    >
                                        <FontAwesomeIcon icon={faCamera}/>
                                    </Button>
                                </Nav.Item>

                                {/*<Nav.Item>*/}
                                {/*    <Button size={"sm"} variant={"link"}>*/}
                                {/*        <FontAwesomeIcon icon={faSearch}/> Query*/}
                                {/*    </Button>*/}
                                {/*</Nav.Item>*/}
                                {/*<Nav.Item>*/}
                                {/*    <Button size={"sm"} variant={"link"}>*/}
                                {/*        <FontAwesomeIcon icon={faFilter}/>*/}
                                {/*    </Button>*/}
                                {/*</Nav.Item>*/}


                            </Nav>
                            <Nav className="ml-auto">
                                <Nav.Item>
                                    {/*<button className={"nav-link"}*/}
                                    {/*        onClick={() => {*/}
                                    {/*            const verticesFilterQuery = this.connector.requestBuilder.filterVertices("Drug", 10, 0);*/}
                                    {/*            const queryPayload = this.connector.requestBuilder.combineQueries(verticesFilterQuery, null);*/}
                                    {/*            this.setState({queryObject: queryPayload});*/}
                                    {/*        }}>*/}
                                    {/*    <FontAwesomeIcon icon={faUserAstronaut}/>*/}
                                    {/*</button>*/}
                                </Nav.Item>


                                <Nav.Item>
                                    <Button size={"sm"} variant={"link"}
                                            onClick={() => this.canvasCtrl.confirmFlushCanvas()}
                                    >
                                        <FontAwesomeIcon icon={faTrashAlt}/>
                                    </Button>
                                </Nav.Item>
                                <Nav.Item className={"ml-3 mr-3"}>
                                    |
                                </Nav.Item>
                                <Nav.Item>
                                    <Button size={"sm"} variant={"link"} onClick={
                                        () => this.setRightContentName("learn")
                                    }>
                                        <FontAwesomeIcon icon={faQuestionCircle}/>
                                    </Button>
                                </Nav.Item>


                                {/*<Nav.Item className={"mr-1"}>*/}
                                {/*    <Button size={"sm"} variant={"link"}>*/}
                                {/*        <FontAwesomeIcon icon={faCog}/>*/}
                                {/*    </Button>*/}
                                {/*</Nav.Item>*/}
                            </Nav>
                        </MenuComponent>
                        <CanvasComponent>

                            {
                                this.state.focusedNodes.length > 0
                                    ? <FocusedNodesList
                                        canvasUtils={this.canvasUtils}
                                        focusedNodes={this.state.focusedNodes}
                                        removeFocusedNode={this.removeFocusedNode.bind(this)}/>
                                    : <React.Fragment/>
                            }
                            {
                                this.state.selectedElementData
                                    ? <NodeMenu
                                        menuPositionX={this.state.menuPositionX}
                                        menuPositionY={this.state.menuPositionY}

                                        setModalContentName={this.setModalContentName.bind(this)}
                                        // setNodeMenuPosition={this.setNodeMenuPosition.bind(this)}

                                        selectedElementData={this.state.selectedElementData}
                                        setSelectedElementData={this.setSelectedElementData.bind(this)}
                                        getFocusedNodes={this.getFocusedNodes.bind(this)}
                                        addNodeToFocusedNodes={this.addNodeToFocusedNodes.bind(this)}

                                        connector={this.connector}
                                        makeQuery={this.makeQuery.bind(this)}

                                        getNetwork={this.getNetwork.bind(this)}

                                        startNewQueryInConsole={this.startNewQueryInConsole.bind(this)}
                                        canvasUtils={this.canvasUtils}
                                    />
                                    : <React.Fragment/>
                            }

                            <ForceDirectedGraphCanvas
                                // queryObject={this.state.queryObject}
                                nodes={this.state.nodes}
                                edges={this.state.edges}
                                resetVisualizer={this.state.resetVisualizer}
                                setNetwork={this.setNetwork.bind(this)}
                                setSelectedElementData={this.setSelectedElementData.bind(this)}
                                setNodeMenuPosition={this.setNodeMenuPosition.bind(this)}
                                onRenderingStatusEnded={this.onRenderingStatusEnded.bind(this)}
                            />

                        </CanvasComponent>
                        <MenuComponent className={"sm footer"}>
                            <Nav className="mr-auto">
                                <Nav.Item className={"mr-3 ml-2"}>
                                    {this.state.statusMessage}
                                </Nav.Item>
                                <Nav.Item>
                                    {
                                        this.state.statusCode
                                            ? <span>{this.state.statusCode} response</span>
                                            : <span></span>
                                    }

                                </Nav.Item>
                            </Nav>
                            <Nav className="ml-auto">
                                <Nav.Item className={"mr-2"}>
                                    {this.state.nodes.length} nodes, {this.state.edges.length} edges
                                </Nav.Item>
                            </Nav>
                        </MenuComponent>
                    </MainContent>
                </Row>

                {
                    this.state.showQueryConsole === true
                        ? <QueryConsole
                            makeQuery={this.makeQuery.bind(this)}
                            connector={this.connector}
                            query={this.state.query}
                            // value={this.state.defaultQuery}
                            onClose={() => {
                                console.log("hide query console");
                                _this.setShowQueryConsole(false);
                            }}
                        />
                        : <React.Fragment/>
                }

                {
                    this.state.modalContentName === "element-options" && this.state.selectedElementData
                        ? <ModalContainer>
                            <ElementOptions
                                selectedElementData={this.state.selectedElementData}
                                setModalContentName={this.setModalContentName.bind(this)}
                                // selectedLabelType={this.state.selectedLabelType}
                                setStatusMessage={this.setStatusMessage.bind(this)}
                                setErrorMessage={this.setErrorMessage.bind(this)}
                                // setHideVertexOptions={this.setHideVertexOptions.bind(this)}
                                onClose={() => {
                                    _this.setModalContentName(null)
                                }}
                                reRenderVisualizer={this.reRenderVisualizer.bind(this)}
                                // reRenderCanvas={this.reRenderCanvas.bind(this)}
                                // setShallReRenderD3Canvas={this.setShallReRenderD3Canvas.bind(this)}
                            />
                        </ModalContainer>

                        : <React.Fragment></React.Fragment>
                }

                {
                    this.state.rightContentName === "learn"
                        ? <RightContainer>
                            <Learn
                                onClose={() => {
                                    _this.setRightContentName(null)
                                }}
                                startNewQueryInConsole={this.startNewQueryInConsole.bind(this)}
                            />
                        </RightContainer>

                        : <React.Fragment></React.Fragment>
                }
                {
                    this.state.isQuerying === true || this.state.isRenderingCanvas === true
                        ? <LoadingDiv statusMessage={this.state.statusMessage}/>
                        : <React.Fragment/>
                }
                {/*<ModalContainer />*/}
                {/*<LoadingDiv statusMessage={this.state.statusMessage}/>*/}
                {/*<LoadingDiv/>*/}
            </DefaultLayout>)
    }

}
