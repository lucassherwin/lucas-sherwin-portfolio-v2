import htm from 'https://unpkg.com/htm?module';

const html = htm.bind(h);

// Preview component for Contact Page
const Contact = createClass({
  render() {
    const entry = this.props.entry;

    return html`
      <main>
        <h1>${entry.getIn(['data', 'title'], null)}</h1>
        <hr/>

        ${this.props.widgetFor('body')}
      </main>
    `;
  },
});

export default Contact;
