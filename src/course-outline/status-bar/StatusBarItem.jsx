import PropTypes from 'prop-types';

const StatusBarItem = ({ title, children }) => (
  <div className="d-flex flex-column justify-content-between">
    <h5>{title}</h5>
    <div className="d-flex align-items-center">
      {children}
    </div>
  </div>
);

StatusBarItem.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

StatusBarItem.defaultProps = {
  children: null,
};

export default StatusBarItem;
