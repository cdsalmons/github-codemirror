chrome.webRequest.onHeadersReceived.addListener(
	function(details)
	{
		var isCSPHeader = function(headerName)
		{
			headerName = String(headerName).toLowerCase();
			return headerName == 'content-security-policy' || headerName == 'x-webkit-csp';
		};
		for(var _i = 0, _csp = ''; _i < details.responseHeaders.length; _i++)
		{
			if(isCSPHeader(details.responseHeaders[_i].name))
			{
				_csp = details.responseHeaders[_i].value,
					_csp = _csp.replace(' script-src ', ' script-src *.filepicker.io '),
					_csp = _csp.replace(' style-src ', ' style-src *.filepicker.io '),
					_csp = _csp.replace(' img-src ', ' img-src *.filepicker.io '),
					_csp = _csp.replace(' connect-src ', ' connect-src *.filepicker.io '),
					_csp = _csp.replace(' frame-src ', ' frame-src *.filepicker.io ');
				details.responseHeaders[_i].value = _csp;
			}
		}
		return {responseHeaders: details.responseHeaders};
	}, {
		types: ['main_frame'],
		urls : ['*://github.com/*']
	}, ['blocking', 'responseHeaders']
);