# kbox - An ultra-simple vanilla.js modal gallery

[![GitHub version](https://badge.fury.io/gh/e-lLess%2Fkslider.svg)](https://badge.fury.io/gh/e-lLess%2Fkslider)

You were dreaming of a light, concise, incisive and efficient script to manage your small modal animations like a pop-up ninja, and kbox.js has arrived with her 7ko all wet.
        
## Demo

https://demo.konfer.be/kbox/

## Installation

Obvious install with [Bower](http://bower.io) (deprecated) :

`$ bower install kbox --save`

Also with [Yarn](https://yarnpkg.com/lang/en/) :

`$ yarn add kbox --save`

Or with [NPM](https://www.npmjs.com/) :

`$ npm install kbox --save`

## How to use ?

In your HTML page, between <head> tags, retrieve styles:

``` html 
<link href="css/kbox.css" rel="stylesheet" type="text/css" media="screen" />
```

And link kbox pack script :

``` html 
<script type="text/javascript" src="js/kbox.min.js"></script>
```

Puts the kbox class on the links where you will place your images, and replace data attributes values with your own values :

``` html 
<a class="kbox" data-kbox="Travels"> <img src="url-to-your-img.jpg" alt="" /> <a>
```

Note the data-kbox attribute, which determine the gallery collection of the picture.
 
An then, invoke the plugin :

``` javascript
window.kbox();
```

## I18n

Kbox display interface text contents in the following languages : french, english, dutch, german, italian, spanish, polish and russian. 

If your language is not supported, create your own locale file and do a pull request !
    
## Dependencies 

Kbox uses hody-icons font icon, packaged into the project.

## Options

Following options are available :

* **lang**: string, lang catalog to use
* **animationSpeed**: int, speed of the transition animation (ms)
* **keyboard**: boolean, using keyboard navigation
* **titles**: boolean, display titles attributes
* **afterOpening**: function(e), function, callback fired after modal opening
* **afterTransition**: function(e), function, callback fired after image display transition
* **afterClosing**: function(e), function, callback fired after modal closing
          
