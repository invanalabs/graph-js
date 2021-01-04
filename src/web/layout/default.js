import React from "react";
import {Nav, Navbar, Container} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCog} from "@fortawesome/free-solid-svg-icons";

export default class DefaultLayout extends React.Component {

    // constructor(props) {
    //     super(props);
    // }

    // static propTypes = {
    //     children: PropTypes.any,
    //     leftSideNav: PropTypes.any,
    //
    //     primaryNav: PropTypes.any,
    //     secondaryNav: PropTypes.any,
    // };

    render() {
        return (
            <Container fluid>
                <Navbar bg="transparent" className={"border-bottom"} expand="lg">
                    <Navbar.Brand href="/">Graph Explorer</Navbar.Brand>
                    <Nav className="ml-auto">
                        <Nav.Item>
                            <Nav.Link href="/connect"
                                      className={this.props.location.pathname === "/connect" ? "active" : ""}>
                                Connect
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link href={"/graph"}
                                      className={this.props.location.pathname === "/graph" ? "active" : ""}>

                                Graph</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link href="/table"
                                      className={this.props.location.pathname === "/table" ? "active" : ""}>
                                Table</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link href="/schema"
                                      className={this.props.location.pathname === "/schema" ? "active" : ""}>
                                Schema</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link href="/settings"
                                      className={this.props.location.pathname === "/settings" ? "active" : ""}>
                                <FontAwesomeIcon icon={faCog}
                                />
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Navbar>
                {this.props.children}
            </Container>
        )
    }
}
