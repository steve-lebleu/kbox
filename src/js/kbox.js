'use strict';

if(typeof(window.kbox) === 'undefined')
{
	/**
	 *
	 */
	const kbox = function() {

		/**
		 *
		 * @type {{orientation: {LANDSCAPE: string, PORTRAIT: string}}}
		 */
		let enums = {
			orientation : {
				LANDSCAPE : 'LANDSCAPE',
				PORTRAIT : 'PORTRAIT'
			}
		};

		/**
		 * Body HTMLElement
		 *
		 * @type {Element}
		 */
		let body = null;

		/**
		 * #kbox-overlay HTMLElement
		 *
		 * @type {Element}
		 */
		let	overlay = null;

		/**
		 * #kbox-modal HTMLElement
		 *
		 * @type {Element}
		 */
		let	modal = null;

		/**
		 * #kbox-info--theme HTMLElement
		 *
		 * @type {Element}
		 */
		let	theme = null;

		/**
		 * #kbox-info--quantities HTMLElement
		 *
		 * @type {Element}
		 */
		let	quantities = null;

		/**
		 * #kbox-info--alt HTMLElement
		 *
		 * @type {Element}
		 */
		let	alt = null;

		/**
		 * JSON locale object
		 *
		 * @type {{}}
		 */
		let catalog = {};

		/**
		 * Modal state (opened|closed)
		 *
		 * @type {boolean}
		 */
		let	state = false;

		/**
		 * Current gallery name
		 *
		 * @type {string}
		 */
		let	gallery = '';

		/**
		 * Galleries of current page contents
		 *
		 * { id: n, name: attr, pictures: [], occurrences: 0 }
		 *
		 * @type {{}}
		 */
		let	galleries = {};

		/**
		 * Cursor into opened gallery
		 *
		 * @type {number}
		 */
		let	pointer = 0;

		/**
		 * Screen size default properties
		 *
		 * @type {{width: number, height: number, orientation: string}}
		 */
		let	screen = { width : window.innerWidth * 0.925 , height : window.innerHeight * 0.925, orientation : enums.orientation.LANDSCAPE };

		/**
		 * Script options
		 *
		 * @type {{}}
		 */
		let options = {
			lang: 'fr',
			animationSpeed: 750,
			keyboard: true,
			titles: true,
			afterOpening : function(e) {},
			afterTransition: function(e) {},
			afterClosing: function(e) {},
		};

		/**
		 * Initialize the script
		 *
		 * @param opt
		 */
		const init = async function(opt) {

			try {

				options = Object.assign(options, opt);

				catalog = await i18n(options.lang);

				if(window.innerWidth < window.innerHeight) screen.orientation = enums.orientation.PORTRAIT;

				body = document.getElementsByTagName('body')[0];

				if(!body) return false;

				let links = document.querySelectorAll('.kbox'),
						numberOfLinks = links.length;

				if(!links.length) return false;

				for(let i = 0 ; i <= numberOfLinks -1 ; i++)
				{
					if(options.titles)
					{
						links[i].title = catalog['display'];
					}
					collect(links[i]);
				}

				body.appendChild( DOM.overlay() );
				body.appendChild( DOM.modal() );

				overlay 		= document.getElementById('kbox-overlay');
				modal 			= document.getElementById('kbox-modal');
				theme 			= document.getElementById('kbox-info--theme');
				alt 				= document.getElementById('kbox-info--alt');
				quantities 	= document.getElementById('kbox-info--quantities');

				events.init(links);
			}
			catch(e)
			{
				alert(e.message);
			}

		};

		/**
		 * Preload a new HTMLElement img
		 *
		 * @param a
		 * @returns {HTMLImageElement}
		 */
		const preload = function(a) {

			let img = new Image();

			img.onload = function() {
				resize(img);
			};

			img.src = a.href;
			img.alt = a.firstElementChild.alt;

			return img;
		};

		/**
		 * Resize img passed as parameter
		 *
		 * @param img
		 * @returns {*|HTMLElement}
		 */
		const resize = function(img) {

			// Si l'image est plus large ou plus haute que l'écran
			let ratio = 1, orientation = img.width < img.height ? enums.orientation.PORTRAIT : enums.orientation.LANDSCAPE;

			// Width AND height most higher that screen
			if(img.width > screen.width && img.height > screen.height)
			{
				let dw = parseFloat( (screen.width / img.width) * 0.80 );
				let dh = parseFloat( (screen.height / img.height) * 0.80 );

				// We set the difference from width or height according to the most higher value
				ratio = dw - dh >= 0 ? dw : dh;
			}
			// Width most higher that screen
			else if(img.width > screen.width)
			{
				// We set the difference according to the property who is most higher than the screen
				ratio = parseFloat( (screen.width / img.width) * 0.80 );
			}
			// Height most higher that screen
			else if(img.height > screen.height)
			{
				// We set the difference according to the property who is most higher than the screen
				ratio = parseFloat( (screen.height / img.height) * 0.80 );
			}

			img.width = img.width * ratio.toFixed(2);
			img.height = img.height * ratio.toFixed(2);

			return img;
		};

		/**
		 * Collect galleries information from HTML tags
		 *
		 * @param a
		 * @returns {*|HTMLImageElement}
		 */
		const collect = function(a) {

			let attr = get.gallery(a),
					n = Object.keys(galleries).length;

			if(typeof galleries[attr] === 'undefined')
			{
				galleries[attr] = { id: n, name: attr, pictures: [], occurrences: 0 };
			}
			else
			{
				galleries[attr].occurrences++;
			}

			galleries[attr].pictures[galleries[attr].occurrences] = preload(a);
		};

		/**
		 * Called after click on image thumbnail
		 * The role of this method is to update internal properties
		 *
		 * @param e
		 */
		const contextualize = function(e) {

			e.preventDefault();

			let img = e.target;
			let a = img.parentElement;

			// Set kbox state to true
			state = true;

			// Set current gallery value
			gallery = get.gallery(a);

			// Set current pointer value
			galleries[gallery].pictures.forEach(function(item, index) {
				if(img.src === item.src) pointer = index;
			});

			window.dispatchEvent(events.custom.modal.contextualized);

		};

		/**
		 * Fill textual contents (gallery name, position, alt attribute, ...)
		 */
		const fill = function() {

			let image = modal.getElementsByTagName('img');

			if(!image.length) throw new Error('Img tag not found');

			image[0].src 		= galleries[gallery].pictures[pointer].src;
			image[0].alt 		= galleries[gallery].pictures[pointer].alt;
			image[0].height = galleries[gallery].pictures[pointer].height;
			image[0].width 	= galleries[gallery].pictures[pointer].width;

			theme.textContent 			= gallery;
			quantities.textContent 	= catalog.position.replace(/{{current}}/i, ( pointer + 1 ).toString() ).replace(/{{total}}/i, ( galleries[gallery].pictures.length ) .toString() );
			alt.textContent 				= galleries[gallery].pictures[pointer].alt;
		};

		/**
		 * Open the modal window
		 *
		 * @param e
		 */
		const open = function(e) {

			e.preventDefault();

			fill();

			Velocity(document.getElementById('kbox-overlay'), { opacity: 1 , display: 'block' , duration: 200 });

			Velocity(modal, {
				top : get.position().y,
				left : get.position().x,
				opacity: 1,
				display: 'block',
				duration: options.animationSpeed
			}, function() { window.dispatchEvent(events.custom.modal.opened); });

		};

		/**
		 * Close the modal window, and remove it from DOM
		 *
		 * @param e event
		 */
		const close = function(e) {

			e.preventDefault();

			pointer = 0, state = false, gallery = '';

			Velocity(overlay, { display: 'none', opacity: 0, duration: 250 } );
			Velocity(modal, { display: 'none', opacity: 0, duration: 250 }, function() { window.dispatchEvent(events.custom.modal.closed) } );
		};

		/**
		 * Do a transition between two images
		 */
		const transition = function() {

			Velocity(modal, { display: 'none', opacity: 0, duration: 250 }, function() {

					fill();

					Velocity(modal, {
						top : get.position().y,
						left : get.position().x,
						opacity: 1,
						display: 'block',
						duration: options.animationSpeed
					}, function() { window.dispatchEvent(events.custom.modal.transitioned); });

				});
		};

		/**
		 * Asynchronous file reading
		 *
		 * @param file
		 * @param cb
		 */
		const readFile = function(file, cb) {
			let xhr = new XMLHttpRequest();
			xhr.overrideMimeType("application/json");
			xhr.open("GET", file, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && xhr.status === 200) {
					cb( { status : 200, json : xhr.responseText });
				}
				else if (xhr.readyState === 4 && xhr.status !== 200){
					cb( { status : xhr.status, json : {} });
				}
			};
			xhr.send(null);
		};

		/**
		 * Read the current locale file
		 *
		 * @param lang
		 */
		const i18n = function(lang) {

			return new Promise( function(resolve, reject) {
				readFile('./locales/' + lang + '.json', function(response) {
					if(response.status === 200) resolve(JSON.parse(response.json));
					else reject(JSON.parse(response.json))
				});
			});
		};

		/**
		 * Sub namespace getters
		 *
		 * @type {{gallery: (function(*): string)}}
		 */
		const get = {

			/**
			 * Get current gallery name
			 *
			 * @param a
			 * @returns {string}
			 */
			gallery: function(a) {
				return a.getAttribute('data-kbox') !== undefined ? a.getAttribute('data-kbox') : 'isolated';
			},

			/**
			 * Get the positions coordinates where place the modal
			 *
			 * @returns {{x: number, y: number}}
			 */
			position: function() {
				return {
					x : parseFloat( ( ( window.innerWidth - galleries[gallery].pictures[pointer].width ) / 2 ) -10 ),
					y : parseFloat( ( ( window.innerHeight - galleries[gallery].pictures[pointer].height ) / 2 ) - 10 )
				};
			}
		};

		/**
		 * Sub namespace events management
		 *
		 * @type {{keyboard: keyboard, navigation: navigation, closing: closing, opening: opening}}
		 */
		const events = {

			/**
			 * Custom events
			 */
			custom : {
				modal : {
					contextualized : new Event('modal.contextualized'),
					pointed : new Event('modal.pointed'),
					opened : new Event('modal.opened'),
					transitioned : new Event('modal.transitioned'),
					closed : new Event('modal.closed'),
				}
			},

			/**
			 * Initialize events binding
			 *
			 * @param links
			 */
			init: function(links) {
				window.addEventListener('modal.contextualized', open );
				window.addEventListener('modal.pointed', transition );
				window.addEventListener('modal.opened', options.afterOpening );
				window.addEventListener('modal.transitioned', options.afterTransition );
				window.addEventListener('modal.closed', options.afterClosing );
				events.opening(links);
				options.keyboard && events.keyboard();
				events.closing();
				events.navigation();
			},

			/**
			 * Attach click event on each link
			 * When click event is fired, launch :
			 *
			 * - contextualize
			 * - show
			 *
			 * @param links
			 */
			opening : function(links) {
				links.forEach( function(item) {
					item.addEventListener('click', contextualize, false);
				});
			},

			/**
			 * Hide the modal window by click on close triggers
			 *
			 * @returns {boolean}
			 */
			closing : function() {
				let triggers = document.querySelectorAll('.kbox-close--trigger');
				if(!triggers.length) return false;
				triggers.forEach( function(item) {
					item.addEventListener('click', close, false);
				});
			},

			/**
			 * Manage the keyboard navigation
			 *
			 * @returns {boolean}
			 */
			keyboard : function() {

				body.addEventListener('keyup', function(e) {

					e.preventDefault();

					if(state === true)
					{
						let key = e.keyCode;

						switch(key)
						{
							// Left
							case 37 :
							case 100 :

								if(pointer - 1 < 0)
								{
									pointer = galleries[gallery].pictures.length - 1;
								}
								else
								{
									pointer--;
								}

								window.dispatchEvent(events.custom.modal.pointed);

								break;

							// Right
							case 39 :
							case 102 :

								if(pointer + 1 > galleries[gallery].pictures.length - 1)
								{
									pointer = 0;
								}
								else
								{
									pointer++;
								}

								window.dispatchEvent(events.custom.modal.pointed);

								break;

							// Escape
							case 27 :

								close();

								break;
						}
					}
				}, false);
			},

			/**
			 * Manage the navigation by click on navigation triggers
			 *
			 * @returns {boolean}
			 */
			navigation: function() {

				let triggers = document.querySelectorAll('.kbox-nav');

				if(!triggers.length) return false;

				triggers.forEach( function(item) {

					item.addEventListener('click', function(e) {

						e.preventDefault();

						if(e.target.id === 'kbox-nav--prev')
						{
							if(pointer - 1 < 0)
							{
								pointer = galleries[gallery].pictures.length - 1;
							}
							else
							{
								pointer--;
							}
						}
						else
						{
							if(pointer + 1 > galleries[gallery].pictures.length - 1)
							{
								pointer = 0;
							}
							else
							{
								pointer++;
							}
						}

						window.dispatchEvent(events.custom.modal.pointed);

					}, false);
				});
			}
		};

		/**
		 * Sub namespace DOM management
		 *
		 * @type {{navigation: (function(*=): HTMLElement), overlay: (function(): HTMLElement), modal: (function(): HTMLElement)}}
		 */
		const DOM = {

			/**
			 * Build the HTML tags of the modal window overlay
			 *
			 * @returns {HTMLElement}
			 */
			overlay: function () {

				let node = document.createElement('div');
				node.setAttribute('id', 'kbox-overlay');
				node.setAttribute('class', 'kbox-close--trigger');
				return node;
			},

			/**
			 * Build the HTML tags of the modal window navigation
			 *
			 * @param id
			 * @returns {HTMLElement}
			 */
			navigation: function(id) {
				let navigation = document.createElement('div');
				navigation.setAttribute('id', id);
				navigation.setAttribute('class', 'kbox-nav');
				if(options.titles)
				{
					navigation.setAttribute('title', id === 'kbox-nav--prev' ? catalog.previous : catalog.next);
				}
				let arrow = document.createElement('span');
				arrow.setAttribute('class', id === 'kbox-nav--prev' ? 'hc hc-arrow-round-back' : 'hc hc-arrow-round-forward');
				navigation.appendChild(arrow);
				return navigation;
			},

			/**
			 * Build the HTML tags of the full modal window
			 */
			modal: function () {

				let node = document.createElement('div');
				node.setAttribute('id', 'kbox-modal');

				let close = document.createElement('div');
				close.setAttribute('id', 'kbox-close');
				close.setAttribute('class', 'kbox-close--trigger');
				if(options.titles)
				{
					close.setAttribute('title', catalog.close);
				}

				let cross = document.createElement('i');
				cross.setAttribute('class', 'hc hc-close');

				close.appendChild(cross);

				let image = new Image();
				image.setAttribute('id', 'kbox-image');

				let info = document.createElement('div');
				info.setAttribute('id', 'kbox-info');

				let context = document.createElement('div');
				context.setAttribute('id', 'kbox-info--context');

				let theme = document.createElement('span');
				theme.setAttribute('id', 'kbox-info--theme');

				let quantities = document.createElement('span');
				quantities.setAttribute('id', 'kbox-info--quantities');

				let alt = document.createElement('div');
				alt.setAttribute('id', 'kbox-info--alt');

				context.appendChild(theme);
				context.appendChild(quantities);

				info.appendChild(context);
				info.appendChild(alt);

				let prev = DOM.navigation('kbox-nav--prev');
				let next = DOM.navigation('kbox-nav--next');

				node.appendChild(prev);
				node.appendChild(image);
				node.appendChild(next);
				node.appendChild(info);
				node.appendChild(close);

				modal = node;

				return node;
			}
		};

		const self = {};

		self.init = init;

		return self;
	};

	window.kbox = kbox().init;
}
else
{
	console.log('Namespace kbox already exists !');
}