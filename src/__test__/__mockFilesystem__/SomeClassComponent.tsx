import React from "react";

export class SomeClassComponent extends React.PureComponent<{ name: string }> {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
