export function replace(query,params) {
  var _query = query;
  if (params) {
    for (const param in params) {
      _query = _query.replaceAll("@"+param.toUpperCase()+"@",params[param]);
    }
  }
  return _query;
}

export function uri2label(uri) {
  return uri.replace(/^.*[\/|#]([^\/]+)$/,"$1");
}

export function pt2px(_pt) {
  return parseFloat(_pt)/0.75
}

export function px2px(_px) {
  return parseFloat(_px)
}
