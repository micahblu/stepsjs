 /* Steps js
 *
 * Build your form in steps with steps js :)
 * 
 * @author : micahblu | micahblu.com | github.com/micahblu
 * @license http://opensource.org/licenses/MIT MIT License
 * @version 0.1.5
 * 
 */


(function($){
	
	'use strict';

	var 
		// Stores collected form field values
		_fields = {},

		// Will hold an array of steps objects, passed via init options param
		_steps = [], 
		
		// Containing div that contains the entire steps form
		_container = {},

		// Wrapping layout template for the steps
		_layout = {},

		// Array of topics for pub/sub pattern
		_topics = {};

	
	/**
	 * bind a subscriber to a topic
	 * must be chained with following `to` method
	 * @access public
	 * @param Function 
	 * @return Object this
	 */
	function bind(func){
		this.func = func;
		return this;
	}

	/**
	 * Attaches topics to bound function set 
	 * with preceding chained bind method
	 * @access public
	 * @param topics Array
	 * @return Boolean
	 */
	function to(topics){

		if(!topics){
			return false;
		}
		for(var i=0, j=topics.length; i<j; i++){
			if(_topics[topics[i]] === undefined){
				_topics[topics[i]] = [this.func];
			}else{
				_topics[topics[i]].push(this.func);
			}
		}

		return true;
	}

	/**
	 * publish topic events to subscribed observers
	 * @param topic String
	 * @data Object
	 * @access private
	 * @return Boolean
	 */
	function publish(topic, data){
		if(!_topics.hasOwnProperty(topic)){ 
			return false;
		}

		for(var i=0, j=_topics[topic].length; i<j; i++){
			_topics[topic][i](data);
		}
		return true;f
	}

	function init( options ){

		_registerHelpers();

		_container = $(options.container);

		_steps = _generateIds(options.steps);

		_steps = _preRenderSteps(_steps);

		// Inject with steps template
		_layout = _injectTemplates(options.layoutTemplate, _steps, 'step');
		
		// Insert to DOM
		_container.html(_layout);

		// Setup default panel view configuration
		_setPanelDefaults();

		// Setup on DOM event handlers
		_attachEventHandlers();

	}

	/**
	 * generates index based ids for step objects
	 * @param Array arr
	 * @access private
	 * @return Array
	 */
	function _generateIds(arr){
		for(var i=0, j=arr.length; i<j; i++){
			arr[i].id = 'steps-' + i;	
		}
		return arr;
	}

	/**
	 * panelLocked
	 *
	 * @param {panel} jQuery Object
	 * @access private
	 * @return Boolean
	 */
	function _panelLocked(panel){

		if(panel.hasClass('locked')){
			return true;
		}else{
			return false;
		}
	}

	/**
	 * getStoredValues
	 *
	 * Returns stored field value pairs
	 * @access public
	 * @return Object
	 */
	function getStoredValues(){
		return _fields;
	}

	/**
	 * gotoStep
	 *
	 * Will open any unlocked step
	 * @param {step} String 
	 * @access public
	 * @return void
	 */
	function gotoStep(step){

		// panel index will be at a panel index of minus 2
		// this is due to the fact steps start @ 1 and panel id's start at 0 
		// and becuase next is implemented for the behaviour so the panel before the 
		// requested panel needs to be passed for reference
		
		var panelIndex = (parseInt(step.replace("step-", "")) - 1),
			panel = $("#panel-" + panelIndex);

		if(!panelLocked(panel)){
			// Collapse all other open panel bodies
			$('.panel-body').addClass('collapse');

			// Expand this panel's body
			panel.find('.panel-body').removeClass('collapse');
		}else{
			console.log('The panel for step \'' + step + '\' is locked');
		}

	}

	/**
	 * resgisterHelpers
	 *
	 * Registers handlebars helpers
	 * @access private
	 * @return void
	 */
	function _registerHelpers(){
		
		/**
		 * Handlebars 'select' Helper
		 * @param  {object} context	
		 * @return {Handlebars SafeString}
		 */

		if(Handlebars){

			Handlebars.registerHelper('select', function(context){

				// Obtain the model
				if(context.hash.data && context.hash.data.match(/\./)){
							
					var props = context.hash.data.split("."),
							model = window;

					for(var i=0, l=props.length; i < l; i++){
						if(model.hasOwnProperty(props[i])){
							model = model[props[i]];
						}else{
							console.log(model + ' does not have: ' + props[i]);
							break;
						}
					};
				}else if(context.hash.data){
					model = window[context.hash.data];
				}else{
					console.log('Error: Select helper needs a data context to be passed as a paramter');
					return;
				}
			
				// Build the component
				var ret = '<select',
						label = context.hash.dataLabelField,
						value = context.hash.dataValueField,
						defaultSelection = context.hash.defaultSelection;

				// add element attributes from context hash
				for(var field in context.hash){
		          if(context.hash.hasOwnProperty(field) && field !== 'data'){
		            ret += ' ' + field + '=' + '"' + context.hash[field] + '"';
		          }
		        }

				ret += '>';

				if(context.hash.placeholder){
					ret += '<option value="">' + context.hash.placeholder + '</option>';
				}
				for(var i=0; i < model.length; i++){
					ret += '<option value="' + model[i][value] + '" ' + (defaultSelection === model[i][value] ? 'selected="selected"' : '') + '>' + model[i][label] + '</option>';
				}

				ret += '</select>';

				return new Handlebars.SafeString(ret);
			});
		}
	}

	/**
	 * evaluate evaluates validation conditions on panels and locks/unlocks steps accordingly	
	 *
	 * @param  jQuery Object panel
	 * @access public
	 * @return Boolean
	 */
	function evaluate(panel){
		
		if(_conditionsMet(panel)) {
			_unlockNextStep(panel);

			publish('onPanelValidated', { values: _fields, panel: panel });

			return true;
		}
		else {
			_lockNextStep(panel);
			return false;
		}
	}


	/**
	 * updateStep
	 *
	 * Updates the handlebars template for a given step with new context 
	 * @param String step
	 * @param Object context
	 * @access public
	 * @return void
	 */
	function updateStep(step, context){

		var panelIndex = (step.replace("step-", "")),
			panelID = "#panel-" + panelIndex,
			html = _steps[panelIndex].template.render(context);

		$(panelID).find('.panel-content').html(html);
	}

	/**
	 * conditionsMet
	 * @param  jQuery object panel
	 * @access private
	 * @return Boolean
	 */
	function _conditionsMet(panel){

		if(!panel){
			return false;
		}

		//set our conditions and met vars
		var self =this,
			conditions = 0,
			met = 0,
			regex = '',
			required,
			rgroup = [];

		// check for conditions being met, if so allow continue button
		panel.find('input[type="text"], input[type="hidden"], input[type="checkbox"], select, textarea').not(":hidden").each(function(e){

			required = this.getAttribute('data-condition');

			if(required){

				conditions++;

				_fields[this.name] = this.value;

				var handler = this.getAttribute('data-validator');

				if(handler){
					if(!setup[handler]){
						console.log('[Stepsjs Alert]: A custom validation handler was defined for "' + this.name + '" but no handler method was declared in the configuration object');
					}else{
						if(setup[handler].apply(null, [this])){
							// add value to _fields object
							_fields[this.name] = this.value;
							met++;
						}
					}
				}
				// No custom handler defined, rely on data-expected attribute for validation
				else{

					regex = this.getAttribute('data-expected');

					if(regex){
						var patt = new RegExp(regex);
						if(patt.test( $(this).val().trim() )){

							// add value to _fields object
							_fields[this.name] = this.value;
							met++;
						}
					}
					else if($(this).val().trim() !== "" && this.type !== 'radio'){
						// add value to _fields object
						_fields[this.name] = this.value;
						
						met++;
					}
				}
			
			}
		});
		
		panel.find('input[type="radio"]').each(function(){

			// Find condition to meet
			if(this.getAttribute('data-condition') === 'required' && !rgroup[this.name]){
				rgroup[this.name] = true;
				conditions++;
			}

			// Collect met conditions
			if(this.getAttribute('data-condition') === 'required' && rgroup[this.name] && this.checked){
				_fields[this.name] = this.value;
				met++;
			}
		});

		//TODO: Add hook
		if(conditions === met){
			_steps[panel.attr('id').replace(/[^0-9]+/, '')].validates = true;
			return true;
		}else{
			_steps[panel.attr('id').replace(/[^0-9]+/, '')].validates = false;
			return false;
		}
	}

	/**
	 * unlockNextStep 
	 *
	 * unlocks all validated subsequent steps
	 * @param  jQuery object panel
	 * @access private
	 * @return void
	 */
	function _unlockNextStep(panel){
		
		// Enable next button
		panel.find(".next-step").removeAttr("disabled");

		// Unlock the next step..
		panel.next().removeClass('locked');

		// unlock all next panels where conditions are met
		for(var i=0, j=_steps.length; i < j; i++){
			if(_steps[i].validates){
				$("#panel-" + (_steps[i].id + 1) ).removeClass('locked');
			}
		}
	}

	/**
	 * lockNextStep 
	 * 
	 * locks all subsequent panels
	 * @param  jQuery object panel
	 * @access private
	 * @return void
	 */
	function _lockNextStep(panel){
		panel.find(".next-step").attr("disabled", "disabled");
		panel.nextAll().addClass('locked');
	}

	/**
	 * next 
	 * 
	 * collapses current panel and displays next
	 * @param  Object panel
	 * @access public
	 * @return void
	 * TODO! Needs to check to see if the next panel is locked
	 */
	function next(panel){
		
		publish('onBeforeLoadNext', { panel: panel });

		panel.find('.panel-body').addClass('collapse');

		panel.next().find('.panel-body').removeClass('collapse');
		
		publish('onAfterLoadNext', { panel: panel });
	}

	/**
	 * prev 
	 * 
	 * collapses current panel and displays previous								
	 * @param  Object panel
	 * @access public
	 * @return void
	 */
	function prev(panel){
		
		publish('onBeforeLoadPrev', { panel: panel });

		panel.find('.panel-body').addClass('collapse');

		panel.prev().find('.panel-body').removeClass('collapse');

		publish('onAfterLoadPrev', { panel: panel });
	}

	/**
	 * matches a pattern in a string
	 *
	 * @param  String  term
	 * @param  String  str
	 * @access private
	 * @return Boolean
	 */
	function _has(term, str){
		var patt = new RegExp(term);
		return patt.test(str);
	}

	/**
	 * resolveHbTemplateType
	 * 
	 * @parm steps Array
	 * @return String enum 'pre_compiled' | 'in_document'
	 */
	function _preCompileTemplate(template_src, context){
		
		// Based on template syntax look for either in document handlebars template or
		// or load from an already loaded external template file  
		var source,
			template,
			output;

		// Handlebars In Dom
		if(/#/.test(template_src)){

			source = $(template_src).html();

			template = Handlebars.compile(source);
			
			output = new Handlebars.SafeString(template(context));

		}
		// Handlebars Pre Compiled 
		else{

			template = template_src.render;

			output = new Handlebars.SafeString(template(context));
		}

		return output;
		
	}

	function _preRenderSteps(steps){

		var containerSrc = steps.container,
			containerContext = {};

		// Pre Render the steps templates
		for(var i=0, j=steps.length; i<j; i++){
			steps[i].template = _preCompileTemplate(steps[i].template, steps[i].context);
		}

		return steps;
	}

	function _injectTemplates(layout, templates, outlet){

		var injection,
			output,
			context;

		for(var i=0, j=templates.length; i<j; i++){
			injection = templates[i].template;
			
			context = $.extend(templates[i].context, {
				id: i,
				steps: injection
			});

			output += _preCompileTemplate(layout, context);
		}

		if(output !== undefined){
			return output.replace('undefined', ''); // TEMP HACK!!! Fix this
		}

	}

	function _setPanelDefaults(){
		
		_container.find('.panel-body').addClass('collapse');

		_container.find('.panel-container:first').find('.panel-body').removeClass('collapse');

		// by default make all next button's disabled
		_container.find(".next-step").attr("disabled", "disabled");

		// remove the prev button from first step panel
		_container.find("#panel-0 .prev-step").hide();

		// by default lock panels
		_container.find(".panel-container").addClass('locked');

		// Unlock first step 
		_container.find(".panel-container:first-child").removeClass('locked');
	}

	function _preEvaluatePanels(){

		// before proceeding evaluate all steps as they might have been pre-populated
		_container.find(".steps-wrapper .panel-container").each(function(){

			var panel = $(this);
			//var lastValidPanel = null;
			var lastPanel = "panel-" + (_steps.length - 1);

			if(evaluate(panel) && panel.attr('id') !== lastPanel){
				next(panel);
			}else{
				return false;
			}
		});

	}

	function _attachChangeEvents(){

		_container.on('keyup change', 'select, input, textarea', function(e){
			
			// add value to _fields object
			_fields[this.name] = this.value;

			var panel = $(e.target).parents('.panel-container');

			//var send = $.extend({ _fields: _fields, event: e }, commonpublishResponse(panel));

			publish('onFieldChange', { panel: panel, event: e });

			evaluate(panel);
		});
	}



	function _attachClickEvents(){
		
		// Event Delegation
		_container.on('click', function(e){

			var panel = $(e.target).parents(".panel-container");
			
			//var send = $.extend({ e: e }, commonpublishResponse(panel));

			publish('onClickEvent', { panel: panel });

			if(_has("next-step", e.target.className) && !e.target.disabled){
				next(panel);
			} else if(_has("prev-step", e.target.className) && !e.target.disabled){
				prev(panel);
			} else if(_has("panel-heading", e.target.className) || _has("panel-title", e.target.className)){

				if(!panel.hasClass("locked")){

					if(panel.find(".panel-body").hasClass("collapse")){
					
						// collapse this panel
						$('.panel-body').addClass('collapse');

						// expand this panel
						panel.find(".panel-body").removeClass('collapse');

						publish('onPanelExpanded', { panel: panel });
					}
				}
			}
		});
	}

	function _attachEventHandlers(){
		_attachChangeEvents();
		_attachClickEvents();
	}


	/**
	 * $.steps 
	 * Exposes stepsjs API
	 */
	$.steps = (function(){
		return {
			gotoStep: gotoStep,
			evaluate: evaluate,
			updateStep: updateStep,
			getStoredValues: getStoredValues,
			bind: bind,
			to: to

		};
	})();

	$.fn.steps = function( options ) {
		return this.each(function(){
			options.container = this;
			init( options );
		});
	};
}(jQuery));