const React = require('react');

exports.Link = ({ children, to }) => React.createElement('a', { href: to }, children);

exports.useNavigate = () => {
  return () => {};
};

exports.useParams = () => ({ eventId: '1' });

exports.useSearchParams = () => [new URLSearchParams(window.location.search), () => {}];

exports.BrowserRouter = ({ children }) => React.createElement('div', null, children);
