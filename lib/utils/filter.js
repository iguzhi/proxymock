const requiredRequestHeaderFields = [
  'Host',
  'Connection',
  'Pragma',
  'Cache-Control',
  'User-Agent',
  'Content-Type',
  'X-Requested-With',
  'Accept',
  // 'Accept-Encoding', // must be removed, for proxy server maybe have no ability to ungzip received data.
  'Accept-Language',
  'Accept-Charset',
  'Cookie',
  'Origin',
  'Referer',
  'Authorization',
  'If-Modified-Since'
];

const requiredResponseHeaderFields = [
  'Allow',
  'Age',
  'Connection',
  'Pragma',
  'Cache-Control',
  'Content-Type',
  // 'Content-Length', // must be removed, for proxy server received data is not gzipped, and the length is changed.
  'Location',
  'Date',
  'Server',
  'Vary',
  'Expires',
  'Last-Modified',
  'Set-Cookie',
  'Status',
  'X-Powered-By',
  'Content-Language',
  'Refresh',
  'ETag'
];

const omitRequestHeaderFields = [
  'Accept-Encoding'
];

const omitResponseHeaderFields = [
  'Content-Length'
];

const requiredRemovedCacheHeaderFields = [
  'Age',
  'Cache-Control',
  'Pragma',
  'ETag',
  'Expires',
  'Last-Modified',
  'If-Modified-Since',
  'If-None-Match'
];

function filterHeaders(inputHeader, requiredHeaderFields) {
  const lowerCaseInputHeader = {};
  for (let inputHeaderKey in inputHeader) {
    if (inputHeader.hasOwnProperty(inputHeaderKey)) {
      lowerCaseInputHeader[inputHeaderKey.toLowerCase()] = inputHeader[inputHeaderKey];
    }
  }
  const header = {};
  requiredHeaderFields.forEach(field => {
    const value = lowerCaseInputHeader[field.toLowerCase()];
    if (value) {
      header[field] = value;
    }
  });
  return header;
}

 function omitHeaders(inputHeader, omitHeaderFields) {
  const lowerCaseInputHeader = {};
  for (let inputHeaderKey in inputHeader) {
    if (inputHeader.hasOwnProperty(inputHeaderKey)) {
      lowerCaseInputHeader[inputHeaderKey.toLowerCase()] = inputHeader[inputHeaderKey];
    }
  }
  omitHeaderFields.forEach(field => {
    delete lowerCaseInputHeader[field];
  });

  return lowerCaseInputHeader;
}

exports.filterRequestHeaders = requestHeader => {
  return filterHeaders(requestHeader, requiredRequestHeaderFields);
}

exports.filterResponseHeaders = responseHeader => {
  return filterHeaders(responseHeader, requiredResponseHeaderFields);
}

exports.omitRequestHeaders = requestHeader => {
  return omitHeaders(requestHeader, omitRequestHeaderFields);
}

exports.omitResponseHeaders = responseHeader => {
  return omitHeaders(responseHeader, omitResponseHeaderFields);
}

exports.removeCacheHeaders = header => {
  requiredRemovedCacheHeaderFields.forEach(field => {
    delete header[field];
    delete header[field.toLowerCase()];
  });
}
