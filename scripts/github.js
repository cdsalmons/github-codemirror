(function($)
{
	'use strict'; // Standards.

	var onReady = function() // On DOM ready state.
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
				'  <i class="octicon octicon-cloud-upload"></i> <a href="#">Upload Files</a> (of any type) — powered by FilePicker.io' +
				'</div>',

			getOption = function(option, defaultValue)
			{
				var value = localStorage.getItem('githubCodemirror_' + option);
				return value !== null ? value : defaultValue;
			},
			updateOption = function(option, value)
			{
				localStorage.setItem('githubCodemirror_' + option, value);
			},
			cmOptions = {
				tabSize       : 3,
				lineWrapping  : true,
				lineNumbers   : false,
				matchBrackets : true,
				indentWithTabs: true,
				mode          : 'gfm',
				keyMap        : 'default',
				theme         : getOption('cmTheme', 'ambiance'),
				extraKeys     : {
					'F11'  : function(cm)
					{
						var isFullScreen = cm.getOption('fullScreen');
						cm.setOption('fullScreen', !isFullScreen);

						if(!$('.github-codemirror-fs-toggle').length)
							$('body').append($(fsToggle));

						if(!$('.github-codemirror-fs-upload-files').length)
							$('body').append($(fsUploadFiles));

						if(isFullScreen) // Toggle off?
							$('.github-codemirror-fs-toggle').off('.githubCodemirror').hide(),
								$('.github-codemirror-fs-upload-files').off('.githubCodemirror').hide();

						else $('.github-codemirror-fs-toggle').off('.githubCodemirror').show().on('click.githubCodemirror', function(e)
						{
							e.preventDefault(),
								e.stopImmediatePropagation();

							cm.setOption('fullScreen', false), $(this).off('.githubCodemirror').hide();
						}),
							$('.github-codemirror-fs-upload-files').off('.githubCodemirror').show().on('click.githubCodemirror', function(e)
							{
								e.preventDefault(),
									e.stopImmediatePropagation();

								uploadTo(cm); // Perform the upload.
							});
					},
					'Enter': 'newlineAndIndentContinueMarkdownList'
				}
			}, // CodeMirror options.
			cmThemeURL = chrome.extension.getURL('scripts/codemirror/theme/' + cmOptions.theme + '.css');

		var convert = function() // Textarea.
		{
			var $this = $(this), cm, $uploadFiles, // Initialize.
				$comment = $this.closest('.timeline-comment-wrapper');

			if($this.data('githubCodemirror'))
				return; // Already did this.

			cm = CodeMirror.fromTextArea(this, cmOptions),
				$this.data('githubCodemirror', cm); // Reference.

			$comment.find('.comment-form-head .preview-tab').on('click.githubCodemirror', cm.save);
			$comment.find('.comment-form-head .enable-fullscreen').on('click.githubCodemirror', function(e)
			{
				e.preventDefault(),
					e.stopImmediatePropagation();

				cm.setOption('fullScreen', true);

				if(!$('.github-codemirror-fs-toggle').length)
					$('body').append($(fsToggle));

				if(!$('.github-codemirror-fs-upload-files').length)
					$('body').append($(fsUploadFiles));

				$('.github-codemirror-fs-toggle').off('.githubCodemirror').show().on('click.githubCodemirror', function(e)
				{
					e.preventDefault(),
						e.stopImmediatePropagation();

					cm.setOption('fullScreen', false),
						$(this).off('.githubCodemirror').hide(),
						$('.github-codemirror-fs-upload-files').off('.githubCodemirror').hide();
				});
				$('.github-codemirror-fs-upload-files').off('.githubCodemirror').show().on('click.githubCodemirror', function(e)
				{
					e.preventDefault(),
						e.stopImmediatePropagation();

					uploadTo(cm); // Perform the upload.
				});
			});
			$comment.find('.drag-and-drop').replaceWith($uploadFiles = $(uploadFiles)),
				$uploadFiles.find('> a').on('click.githubCodemirror', function(e)
				{
					e.preventDefault(),
						e.stopImmediatePropagation();

					uploadTo(cm); // Perform the upload.
				});
			$this.closest('form').on('submit.githubCodemirror', function()
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
			$('.sidebar-labels .js-menu-target').off('.githubCodemirror').on('click.githubCodemirror', function(e)
			{
				$('.comment-form-textarea').each(function()
				                                 {
					                                 var $this = $(this), // Initialize.
						                                 cm = $this.data('githubCodemirror');
					                                 if(cm) cm.save(); // Update code mirror.
				                                 });
			});
		};
		var uploadTo = function(cm)
		{
			var key = getOption('filepickerKey'); // Current option value.
			if(!key && !(key = prompt('Enter your personal FilePicker.io key:\n' +
			                          'Please create a personal App at FilePicker.io to obtain a key:' +
			                          ' See: https://developers.filepicker.io/apps/', '')))
				return; // No key to work with in this case.

			updateOption('filepickerKey', key), filepicker.setKey(key),
				filepicker.pickMultiple({}, function(files)
				{
					$.each(files, function(i, file)
					{
						var ext = ''; // Initialize.

						if(file.filename.indexOf('.') !== -1)
							ext = file.filename.split('.'), // Dots.
								ext = ext[ext.length - 1].toLowerCase();

						if(/^image\//i.test(file.mimetype))
							cm.replaceSelection('![](' + file.url + '#.' + ext + ')\n');
						else cm.replaceSelection(file.url + '#.' + ext + '\n');
					});
				});
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

			return $textarea.data('githubCodemirror');
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
		$('head').append('<style type="text/css">' +
		                 '   @import url("' + cmThemeURL + '");' +
		                 '</style>');
		$('.comment-form-textarea').each(convert), // On an interval also.
			setInterval(function(){ $('.comment-form-textarea').each(convert); }, 500);
		$('body').on('keydown.githubCodemirror', onBodyKeyDown).on('keyup.githubCodemirror', onBodyKeyUp);
	};
	$(document).ready(onReady); // On DOM ready state.
})(jQuery);