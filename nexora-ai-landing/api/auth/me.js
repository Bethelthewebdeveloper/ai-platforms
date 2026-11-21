import handler from "../core-handler.js";

export default function me(request, response) {
  request.url = "/api/core-handler?path=auth%2Fme";
  return handler(request, response);
}
