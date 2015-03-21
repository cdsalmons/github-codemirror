(function($)
{
	'use strict'; // Standards.

	var onReady = function() // On DOM ready.
	{
		var fillOptions = function()
		{
			chrome.storage.sync.get(
				{
					cmTheme: 'ambiance',

					filePickerKey  : '',
					filePickerFancy: '',

					autoFsEditRegex: ''

				}, function(options)
				{
					$('#cmTheme').val(options.cmTheme);
					$('#filePickerKey').val(options.filePickerKey);
					$('#filePickerFancy').val(options.filePickerFancy);
					$('#autoFsEditRegex').val(options.autoFsEditRegex);
				});
		};
		fillOptions(); // Set up existing options.

		var saveOptions = function()
		{
			chrome.storage.sync.set(
				{
					cmTheme: $.trim($('#cmTheme').val()),

					filePickerKey  : $.trim($('#filePickerKey').val()),
					filePickerFancy: $.trim($('#filePickerFancy').val()),

					autoFsEditRegex: $.trim($('#autoFsEditRegex').val())

				}, function()
				{
					var $status = $('.options .save-status');
					$status.show(), setTimeout(function(){ $status.hide(); }, 5000);
				});
		};
		$('.options .save').on('click', saveOptions);
	};
	$(document).ready(onReady);
})(jQuery);