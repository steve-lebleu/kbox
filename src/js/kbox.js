'use strict';

if(typeof(window.kbox) === 'undefined')
{
	/**
	 *
	 */
	const kbox = function() {

		/**
		 * Body HTMLElement
		 *
		 * @type {Element}
		 */
		let body = null;

		/**
		 * #kbox-modal HTMLElement
		 *
		 * @type {Element}
		 */
		let	modal = null;

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
		 * @type {{width: number, height: number}}
		 */
		let	screen = { width : window.innerWidth * 0.925 , height : window.innerHeight * 0.925 };

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

			options = opt || options;

			catalog = await i18n(options.lang);

			body = document.getElementsByTagName('body')[0];

			if(!body) throw new Error('Body tag not found');

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

			events.init(links);
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
			let ratio = { height : 1, width : 1 };

			// Width AND height most higher that screen
			if(img.width > screen.width && img.height > screen.height)
			{
				let dw = img.width - screen.width;
				let dh = img.height - screen.height;

				// We set the difference from width or height according to the most higher value
				let difference = dw - dh >= 0 ? dw : dh;

				ratio = { height : 1 - parseFloat( '0.' + difference ) , width : 1 - parseFloat( '0.' + difference ) };
			}
			// Width OR height most higher that screen
			else if(img.width > screen.width || img.height > screen.height)
			{
				// We set the difference from width or height
				let difference = img.width > screen.width ? img.width - screen.width : img.height - screen.height;

				ratio = { height : 1 - parseFloat( '0.' + difference ) , width : 1 - parseFloat( '0.' + difference ) };
			}

			img.width = img.width * ratio.width;
			img.height = img.height * ratio.height;

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
		 *
		 */
		const fill = function() {

			let image = modal.getElementsByTagName('img');
			let theme = document.getElementById('kbox-info--theme');
			let alt = document.getElementById('kbox-info--alt');
			let quantities = document.getElementById('kbox-info--quantities');

			if(!image.length) throw new Error('Img tag not found');

			image[0].src = galleries[gallery].pictures[pointer].src;
			image[0].alt = galleries[gallery].pictures[pointer].alt;
			image[0].height = galleries[gallery].pictures[pointer].height;
			image[0].width = galleries[gallery].pictures[pointer].width;

			theme.textContent = gallery;
			quantities.textContent = catalog.position.replace(/{{current}}/i, pointer + 1).replace(/{{total}}/i, galleries[gallery].pictures.length);
			alt.textContent = galleries[gallery].pictures[pointer].alt;
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
				top : ( screen.height - galleries[gallery].pictures[pointer].height ) / 2 ,
				left : ( screen.width - galleries[gallery].pictures[pointer].width ) / 2,
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

			let overlay = document.getElementById('kbox-overlay');
			let modal = document.getElementById('kbox-modal');

			Velocity(overlay, { display: 'none', opacity: 0, duration: 250 } );
			Velocity(modal, { display: 'none', opacity: 0, duration: 250 }, function() { window.dispatchEvent(events.custom.modal.closed) } );
		};

		/**
		 * Do a transition between two images
		 */
		const transition = function() {

			let modal = document.getElementById('kbox-modal');

			Velocity(modal, { display: 'none', opacity: 0, duration: 250 }, function() {

					fill();

					Velocity(modal, {
						top : ( screen.height - galleries[gallery].pictures[pointer].height ) / 2 ,
						left : ( screen.width - galleries[gallery].pictures[pointer].width ) / 2,
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

								transition();

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

								transition();

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

						e = e || window.event;

						e.preventDefault();

						if(e.target.id === 'kbox-nav-prev')
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

						transition();

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