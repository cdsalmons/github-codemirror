(function($)
{
	'use strict'; // Standards.

	var chromeOptions = {}, onReady = function()
	{
		chrome.storage.sync.get(
			{
				cmTheme: 'ambiance',

				filePickerKey  : '',
				filePickerFancy: '',

				autoFsEditRegex: ''

			}, function(options)
			{
				chromeOptions = options,
					onOptionsReady();
			});
	};
	var onOptionsReady = function() // On DOM ready state.
	{
		var fsToggle = // Fullscreen toggler.
				'<div class="github-codemirror-fs-toggle" title="F11 (Fullscreen Toggle)">' +
				'   <i class="octicon octicon-screen-full"></i>' +
				'</div>',

			fsUploadFiles = // File uploader.
				'<div class="github-codemirror-fs-upload-files" title="FilePicker.io">' +
				'  <i class="octicon octicon-cloud-upload"></i>' +
				'</div>',

			uploadFiles = // File uploader.
				'<div class="github-codemirror-upload-files" title="FilePicker.io">' +
				'  <input type="file" multiple="multiple" />' + // Hidden via CSS.
				'  <div class="-drag-n-drop">Or drag n\' drop <i class="octicon octicon-cloud-upload"></i></div>' +
				'  <div class="-progress"><i class="octicon octicon-sync"></i> Uploading...</div>' + // Hidden via CSS.
				'  <i class="octicon octicon-cloud-upload"></i> <a href="#">Upload Files</a> (of any type) — powered by FilePicker.io' +
				'</div>',

			getOption = function(option, defaultValue)
			{
				var value = chromeOptions.hasOwnProperty(option)
					? chromeOptions[option] : undefined; // Default value.
				return value !== undefined && value !== null ? value : defaultValue;
			},
			updateOption = function(option, value)
			{
				var update = {}; // The option we are saving.
				update[option] = value, chrome.storage.sync.set(update),
					chromeOptions[option] = value; // Update value.
			},
			toggleFullscreen = function(cm)
			{
				var isFullScreen = cm.getOption('fullScreen');
				cm.setOption('fullScreen', !isFullScreen);

				if(!$('.github-codemirror-fs-toggle').length)
					$('body').append($(fsToggle));

				if(!$('.github-codemirror-fs-upload-files').length)
					$('body').append($(fsUploadFiles));

				if(isFullScreen) // Toggle fullscreen off?
				{
					$('.github-codemirror-fs-toggle').off('.githubCodeMirror').hide(),
						$('.github-codemirror-fs-upload-files').off('.githubCodeMirror').hide();
					return; // All done in this scenario.
				}
				// Else toggle fullscreen on and setup event handlers.

				$('.github-codemirror-fs-toggle').off('.githubCodeMirror').show().on('click.githubCodeMirror', function(e)
				{
					e.preventDefault(),
						e.stopImmediatePropagation();
					cm.setOption('fullScreen', false), $(this).off('.githubCodeMirror').hide();
				});
				$('.github-codemirror-fs-upload-files').off('.githubCodeMirror').show().on('click.githubCodeMirror', function(e)
				{
					e.preventDefault(),
						e.stopImmediatePropagation();
					uploadTo(cm); // Perform the upload.
				});
			},
			cmOptions = {
				tabSize       : 3,
				dragDrop      : false,
				lineWrapping  : true,
				lineNumbers   : false,
				matchBrackets : true,
				indentWithTabs: true,
				mode          : 'gfm',
				keyMap        : 'default',
				theme         : getOption('cmTheme'),
				extraKeys     : {
					'F11'  : toggleFullscreen,
					'Enter': 'newlineAndIndentContinueMarkdownList'
				}
			}, // CodeMirror options.
			cmThemeURL = chrome.extension.getURL('scripts/codemirror/theme/' + cmOptions.theme + '.css');

		var convert = function() // Textarea.
		{
			var $this = $(this), cm, $uploadFiles, uploadFilesInProgress,
				$comment = $this.closest('.timeline-comment-wrapper');

			if($this.data('githubCodeMirror') || $comment.find('.CodeMirror').length)
				return; // Already has a CodeMirror instance.

			cm = CodeMirror.fromTextArea(this, cmOptions),
				$this.data('githubCodeMirror', cm); // Reference.

			$comment.find('.comment-form-head .preview-tab').on('click.githubCodeMirror', cm.save);
			$comment.find('.comment-form-head .enable-fullscreen').on('click.githubCodeMirror', function(e)
			{
				e.preventDefault(),
					e.stopImmediatePropagation();
				toggleFullscreen(cm); // Toggle fullscreen.
			});
			$comment.find('.drag-and-drop').replaceWith($uploadFiles = $(uploadFiles)),
				filepicker.makeDropPane($comment.find('.CodeMirror')[0], { // Drag n' drop.
					multiple  : true, // Allow for multiple files.
					onSuccess : function(droppedFiles)
					{
						uploadTo(cm, droppedFiles), // Handle files.
							uploadFilesInProgress = false;
					},
					onError   : function(type, message)
					{
						uploadProgressHide(cm), // Hide progress.
							uploadFilesInProgress = false;
					},
					onProgress: function(percentage)
					{
						if(uploadFilesInProgress)
							return; // Already in progress.

						uploadProgressShow(cm), // Display progress.
							uploadFilesInProgress = true;
					}
				}),
				filepicker.makeDropPane($uploadFiles[0], { // Drag n' drop.
					multiple  : true, // Allow for multiple files.
					onSuccess : function(droppedFiles)
					{
						uploadTo(cm, droppedFiles), // Handle files.
							uploadFilesInProgress = false;
					},
					onError   : function(type, message)
					{
						uploadProgressHide(cm), // Hide progress.
							uploadFilesInProgress = false;
					},
					onProgress: function(percentage)
					{
						if(uploadFilesInProgress)
							return; // Already in progress.

						uploadProgressShow(cm), // Display progress.
							uploadFilesInProgress = true;
					}
				}),
				$uploadFiles.find('> a').on('click.githubCodeMirror', function(e)
				{
					e.preventDefault(),
						e.stopImmediatePropagation();
					uploadTo(cm); // Perform the upload.
				});
			if(!getOption('filePickerKey')) // No key, no worky!
				$uploadFiles.find('.-drag-n-drop').html('');

			$this.closest('form').on('submit.githubCodeMirror', function()
			{
				cm.save(); // Let's be sure it's saved!

				var $this = $(this), codeClearInterval,
					codeClearIntervalHandler = function()
					{
						if($this.hasClass('loading'))
							return; // Still loading.

						clearInterval(codeClearInterval);
						if(!$this.find('.comment-form-error:visible').length)
							cm.setValue(''); // Clear the editor.
					};
				setTimeout(function() // Start polling for changes.
				           {
					           codeClearInterval = setInterval(codeClearIntervalHandler, 100);
				           }, 500);
			});
			$comment.find('.timeline-comment-action.js-comment-edit-button').on('click.githubCodeMirror', function()
			{
				setTimeout(function() // Sync w/ textarea and refresh editor.
				           {
					           cm.setValue($(cm.getTextArea()).val()),
						           cm.refresh(); // Refresh instance.

					           try // Automatic fullscreen?
					           {
						           if(getOption('autoFsEditRegex'))
							           if(new RegExp(getOption('autoFsEditRegex'), 'i').test(location.href))
								           toggleFullscreen(cm);
					           }
					           catch(exception) // e.g., Invalid regex.
					           {
						           console.log(exception);
					           }
				           }, 100);
			});
			$this.closest('form[action*="/commit_comment/"]').find('.form-actions button[type="submit"]')
				.each(function() // Enable commit comment submit button; if applicable.
				      {
					      var $this = $(this),
						      eventHandler = function()
						      {
							      $this.removeAttr('disabled'),
								      cm.off('keydown', eventHandler);
						      };
					      cm.on('keydown', eventHandler);
				      });
			if(/\/issues\/new(?:[\/?&#]|$)/i.test(location.href)) // Support the `.wskby` shortcut in Typinator.
				$('.sidebar-labels .js-menu-target').off('.githubCodeMirror').on('click.githubCodeMirror', function(e)
				{
					$('.comment-form-textarea').each(function()
					                                 {
						                                 var $this = $(this), // Initialize.
							                                 cm = $this.data('githubCodeMirror');
						                                 if(cm) cm.save(); // Update code mirror.
					                                 });
				});
		};
		var uploadTo = function(cm, droppedFiles)
		{
			var $comment = $(cm.getTextArea()).closest('.timeline-comment-wrapper'),
				$uploadFiles = $comment.find('.github-codemirror-upload-files'),
				$uploadFilesDragNDrop = $uploadFiles.find('.-drag-n-drop'),
				$uploadFilesProgress = $uploadFiles.find('.-progress'),
				$uploadFilesInput = $uploadFiles.find('input');

			var key = getOption('filePickerKey'); // Current option value.
			if(!key && !(key = prompt( // Provide FilePicker.io instructions.
					'Enter your personal FilePicker.io API key:\n' + // See: <https://developers.filepicker.io/apps/>
					'Please create a personal App at FilePicker.io to obtain a key. See: https://developers.filepicker.io/apps/', ''
				))) return; // No key to work with in this case.

			if(key !== getOption('filePickerKey'))
				updateOption('filePickerKey', key);

			filepicker.setKey(key); // Set the current key.

			if(droppedFiles instanceof Array && droppedFiles.length) // Dropped files?
			{
				uploadProgressShow(cm), // Display upload progress status.
					$.each(droppedFiles, function(i, file) // Insert files.
					{
						cmInsertFile(cm, file); // Insert this dropped file.
						if(i === droppedFiles.length - 1) // Last dropped file?
							uploadProgressHide(cm); // Complete!
					});
			}
			else if(getOption('filePickerFancy') === 'true') // Fancy dialog?
			{
				filepicker.pickMultiple({}, function(files) // Insert one (or more) files.
				{ $.each(files, function(i, file){ cmInsertFile(cm, file); }); });
			}
			else // In this case we simply open a system default file browser.
			{
				$uploadFilesInput.off('.githubCodeMirror').on('change.githubCodeMirror', function()
				{
					var files = this.files; // Array of file objects.
					if(!files.length) // No file objects?
						return; // Nothing to do here.

					uploadProgressShow(cm), // Display an upload progress status.
						$.each(files, function(i, file) // Iterate selected file(s).
						{
							filepicker.store(file, function(file) // Upload this file.
							{
								cmInsertFile(cm, file); // Insert this uploaded file.
								if(i === files.length - 1) // Last uploaded file?
									uploadProgressHide(cm); // Complete!
							});
						});
				}), // Click the `<input type="file" />` automatically.
					$uploadFilesInput.click(); // Opens system file browser now.
			}
		};
		var cmInsertFile = function(cm, file)
		{
			var ext = ''; // Initialize.

			if(file.filename.indexOf('.') !== -1)
				ext = file.filename.split('.'), // Dots.
					ext = ext[ext.length - 1].toLowerCase();

			if(/^image\//i.test(file.mimetype))
				cm.replaceSelection('![](' + file.url + '#.' + ext + ')\n');
			else cm.replaceSelection(file.url + '#.' + ext + '\n');
		};
		var uploadProgressShow = function(cm)
		{
			var $comment = $(cm.getTextArea()).closest('.timeline-comment-wrapper'),
				$uploadFiles = $comment.find('.github-codemirror-upload-files'),
				$uploadFilesDragNDrop = $uploadFiles.find('.-drag-n-drop'),
				$uploadFilesProgress = $uploadFiles.find('.-progress'),
				$uploadFilesInput = $uploadFiles.find('input');

			$uploadFilesDragNDrop.hide(), $uploadFilesProgress.show(),
				$('.github-codemirror-fs-upload-files').find('> i')
					.removeClass('octicon-cloud-upload').addClass('octicon-sync');
		};
		var uploadProgressHide = function(cm)
		{
			var $comment = $(cm.getTextArea()).closest('.timeline-comment-wrapper'),
				$uploadFiles = $comment.find('.github-codemirror-upload-files'),
				$uploadFilesDragNDrop = $uploadFiles.find('.-drag-n-drop'),
				$uploadFilesProgress = $uploadFiles.find('.-progress'),
				$uploadFilesInput = $uploadFiles.find('input');

			$uploadFilesProgress.hide(), $uploadFilesDragNDrop.show(), $uploadFilesInput.val(''),
				$('.github-codemirror-fs-upload-files').find('> i')
					.removeClass('octicon-sync').addClass('octicon-cloud-upload');
		};
		var toPlainText = function(string)
		{
			var lineBreak = '___lineBreak___', // Preserve line breaks.
				lineBreakedHtml = String(string).replace(/\<br(?:\s*\/)?\>/gi, lineBreak)
					.replace(/<p(?:\s+[^>]*)?>(.*?)<\/p>/gi, lineBreak + '$1' + lineBreak);
			return $.trim($('<div>').html(lineBreakedHtml).text().replace(new RegExp(lineBreak, 'g'), '\n'));
		};
		var getWinSelection = function()
		{
			var selection = getSelection();

			if(!selection.rangeCount)
				return; // Nothing.

			var $container = $('<div>'); // Holds the selection.
			for(var i = 0, length = selection.rangeCount; i < length; i++)
				$container.append(selection.getRangeAt(i).cloneContents());

			return toPlainText($container.html());
		};
		var getWinSelectionParent = function()
		{
			var selection = getSelection();

			if(!selection.rangeCount)
				return; // No selection.

			return selection.getRangeAt(0).endContainer;
		};
		var getWinSelectionAuthor = function()
		{
			var $winSelectionParent = $(getWinSelectionParent()),
				$comment = $winSelectionParent.closest('.timeline-comment-wrapper'),
				$commentAuthor = $comment.find('.timeline-comment-header .author'),
				author = $.trim($commentAuthor.text());

			return author ? author : ''; // Default empty string.
		};
		var lastCmInDiscussion = function(inDicussion)
		{
			var $inDicussion = $(inDicussion), // Initialize vars.
				$timeline = $inDicussion.closest('.discussion-timeline'),
				$textarea = $timeline.find('.comment-form-textarea').last();

			return $textarea.data('githubCodeMirror');
		};
		var onBodyKeyDown = function(e)
		{
			if(e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || e.which !== 82)
				return; // Not the `R` key by itself; nothing to do in this case.

			var winSelection = getWinSelection();
			if(!winSelection) return; // No selection.

			e.stopImmediatePropagation(), // Stop other event handlers.
				e.preventDefault(); // Prevent default behavior.
		};
		var onBodyKeyUp = function(e)
		{
			if(e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || e.which !== 82)
				return; // Not the `R` key by itself; nothing to do in this case.

			var winSelection = getWinSelection();
			if(!winSelection) return; // No selection.

			var winSelectionParent = getWinSelectionParent(),
				winSelectionAuthor = getWinSelectionAuthor(),
				cm = lastCmInDiscussion(winSelectionParent);

			if(!winSelection || !winSelectionParent || !cm)
				return; // No selection or no code mirror.

			e.stopImmediatePropagation(), // Stop other event handlers.
				e.preventDefault(); // Prevent default behavior.

			var curVal = cm.getValue(), // Current value.
				reply = ''; // Start w/ empty string.

			reply += curVal ? '\n\n' : '',
				reply += winSelectionAuthor ? '@' + winSelectionAuthor + ' writes...\n' : '',
				reply += winSelection.replace(/^/gm, '> '),
				reply += reply ? '\n\n' : '';

			cm.focus(), cm.execCommand('goDocEnd'),
				cm.replaceSelection(reply),
				cm.execCommand('goDocEnd');
		};
		if(getOption('filePickerKey')) // Needed for drag n' drop.
			filepicker.setKey(getOption('filePickerKey'));

		$('head').append('<style type="text/css">' +
		                 '   @import url("' + cmThemeURL + '");' +
		                 '</style>');
		$('.comment-form-textarea').each(convert), // On an interval also.
			setInterval(function(){ $('.comment-form-textarea').each(convert); }, 500);
		$('body').on('keydown.githubCodeMirror', onBodyKeyDown).on('keyup.githubCodeMirror', onBodyKeyUp);
	};
	$(document).ready(onReady); // On DOM ready state.
})(jQuery);