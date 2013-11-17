function makeAjaxCall(url, successFn, failureFn, isAjax) {
  $.ajax({
    type: "get",
    url: url,
    ajax: isAjax !== undefined ? isAjax : true,
    dataType: "json",
    error: function(request, error) {
      if (failureFn) {
        failureFn (error);
      } else {
        alert (error);
      }
    },
    success: function(jsonResponse) {
      successFn (jsonResponse);
    }
  });
}