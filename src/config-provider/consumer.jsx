import PropTypes from 'prop-types';

/**
 * Creates an object with the same values as object and keys
 * generated by running each own enumerable string keyed property
 * of object thru iteratee.
 * @param {Object} obj
 * @param {Function} fn
 * @return {Object}
 */
const mapKeys = (obj, fn) => {
    const result = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            const newKey = fn(key, value);
            result[newKey] = value;
        }
    }

    return result;
};

/**
 * Replace specific key with prefix `next`
 * and lowercase first character of the result.
 * @param {String} key
 * @return {String}
 */
const replaceKey = key =>
    key.replace(/^(next)([A-Z])/, (match, p1, p2) => p2.toLowerCase());

/**
 * @param {Object} source
 * @return {Object}
 */
const transformContext = source => mapKeys(source, replaceKey);

/**
 * Consumer
 * @param {Object} prop
 * @param {Object} context
 */
const Consumer = ({ children }, context) =>
    typeof children === 'function' ? children(transformContext(context)) : null;

/**
 * PropTypes
 * @type {Object}
 * @static
 */
Consumer.propTypes = {
    // Render context as function
    // Function(context: object): ReactElement
    children: PropTypes.func,
};

/**
 * ContextTypes (legacy context)
 * @type {Object}
 * @static
 */
Consumer.contextTypes = {
    nextPrefix: PropTypes.string,
    nextLocale: PropTypes.object,
    nextPure: PropTypes.bool,
    newRtl: PropTypes.bool,
    nextWarning: PropTypes.bool,
    nextDevice: PropTypes.oneOf(['tablet', 'desktop', 'phone']),
    nextPopupContainer: PropTypes.any,
};

export default Consumer;