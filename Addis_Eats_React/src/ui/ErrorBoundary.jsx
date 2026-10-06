import { Component } from "react";
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <section className="empty-state" role="alert">
          <h2>We couldn't display this page.</h2>
          <p>Please reload to try again. Your saved cart will stay here.</p>
          <button className="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <a className="text-link" href="/">
            Back to home
          </a>
        </section>
      );
    return this.props.children;
  }
}
