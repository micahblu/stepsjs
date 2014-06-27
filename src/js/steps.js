 /* Steps js
 *
 * Build your form in steps with steps js :)
 * 
 * @author : micahblu | micahblu.com | github.com/micahblu
 * @license http://opensource.org/licenses/MIT MIT License
 * @version 0.1.1
 * 
 */
(function($){
	
	'use strict';

	var fields = {},
		step = '',
		template = '',
		out = '',
		parent = {},
		container = {},
		setup = {};

	function init( options ){

		registerHelpers();

		container = $(options.container);

		setup = options;

		prepareSteps();

		renderTemplate();

		setupPanels();

		applyBehaviors();

	}

	/**
	 * panelLocked
	 *
	 * @param {panel} jQuery Object
	 * @return Boolean
	 */
	function panelLocked(panel){

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
	 * 
	 * @return Object
	 */
	function getStoredValues(){
		return fields;
	}

	/**
	 * gotoStep
	 *
	 * Will open any unlocked step
	 * @since
	 * @param {step} String 
	 * @return void
	 */
	function gotoStep(step){

		// panel index will be at a panel index of minus 2
		// this is due to the fact steps start @ 1 and panel id's start at 0 
		// and becuase next is implemented for the behaviour so the panel before the 
		// requested panel needs to be passed for reference
		
		var panelIndex = (parseInt(step.replace("step-", "")) - 1);

		var panel = $("#panel-" + panelIndex);

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
	 *
	 * @return void
	 */
	function registerHelpers(){
		
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
	 * @param  {jQuery Object} panel
	 * @return {Boolean}
	 */
	function evaluate(panel){
		
		if(conditionsMet(panel)) {
			unlockNextStep(panel);

			var send = $.extend({
				values: fields
			}, commonBroadcastResponse(panel));

			broadcast('onPanelValidated', send);

			return true;
		}
		else {
			lockNextStep(panel);
			return false;
		}
	}

	/**
	 * broadcast calls subscribed hook methods on specified events
	 *
	 * @param  {String} theEvent
	 * @param  {Array} params
	 * @return {void}
	 */
	function broadcast(theEvent, theSubject){

		if( setup.subscriptions ){

			var hooks = setup.subscriptions[theEvent];

			if(hooks){

				for(var i=0, j = hooks.length; i < j; i++){

					var func = setup[hooks[i]];

					if(typeof func === 'function'){

						// check to see if a jQuery panel element is passed
						func.apply({event: theEvent}, [ theSubject ] );
					}
				}
			}
		}
	}

	/**
	 * updateStep
	 *
	 * Updates the handlebars template for a given step with new context 
	 * @param {String} step
	 * @param {Object} context
	 * @return void
	 */
	function updateStep(step, context){

		var panelIndex = (step.replace("step-", "")),
				panelID = "#panel-" + panelIndex,
				html = setup.steps[panelIndex].template.render(context);

		$(panelID).find('.panel-content').html(html);
	}
 
	function applyFilter(filterRef, filterEl){
		var treatments = setup.treatments[filterRef],
			ret;

		if(treatments){

			for(var i = 0, j = treatments.length; i < j; i++){
				
				var func = setup[treatments[i]];

				if(typeof func === 'function'){
					var response = func.apply({event: filterRef}, [filterEl]);
					if(typeof response === 'string'){
						ret += response;
					}else{
						ret = response;
					}
				}
			}
		}
		return ret;
	}

	/**
	 * conditionsMet
	 * @param  {jQuery object} panel
	 * @return {Boolean}
	 */
	function conditionsMet(panel){

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

				fields[this.name] = this.value;

				var handler = this.getAttribute('data-validator');

				if(handler){
					if(!setup[handler]){
						console.log('[Stepsjs Alert]: A custom validation handler was defined for "' + this.name + '" but no handler method was declared in the configuration object');
					}else{
						if(setup[handler].apply(null, [this])){
							// add value to fields object
							fields[this.name] = this.value;
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

							// add value to fields object
							fields[this.name] = this.value;
							met++;
						}
					}
					else if($(this).val().trim() !== "" && this.type !== 'radio'){
						// add value to fields object
						fields[this.name] = this.value;
						
						met++;
					}
				}
			
			}
		});
		
		rgroup = [];
		panel.find('input[type="radio"]').each(function(){

			// Find condition to meet
			if(this.getAttribute('data-condition') === 'required' && !rgroup[this.name]){
				rgroup[this.name] = true;
				conditions++;
			}

			// Collect met conditions
			if(this.getAttribute('data-condition') === 'required' && rgroup[this.name] && this.checked){
				fields[this.name] = this.value;
				met++;
			}
		});

		//TODO: Add hook
		if(conditions === met){
			setup.steps[panel.attr('id').replace(/[^0-9]+/, '')].validates = true;
			return true;
		}else{
			setup.steps[panel.attr('id').replace(/[^0-9]+/, '')].validates = false;
			return false;
		}
	}

	/**
	 * unlockNextStep unlocks all validated subsequent steps
	 * @param  {jQuery object} panel
	 * @return {void}
	 */
	function unlockNextStep(panel){
		
		// Enable next button
		panel.find(".next-step").removeAttr("disabled");

		// Unlock the next step..
		panel.next().removeClass('locked');

		// unlock all next panels where conditions are met
		for(var i=0, j=setup.steps.length; i < j; i++){
			if(setup.steps[i].validates){
				$("#panel-" + (setup.steps[i].id + 1) ).removeClass('locked');
			}
		}
	}

	/**
	 * lockNextStep locks all subsequent panels
	 * @param  {jQuery object} panel
	 * @return {void}
	 */
	function lockNextStep(panel){
		panel.find(".next-step").attr("disabled", "disabled");
		panel.nextAll().addClass('locked');
	}

	function commonBroadcastResponse(panel){
		
		if(panel){
			if(panel.attr('id')){

				var index = panel.attr('id').replace(/[^0-9]+/, '');
				var stepslug = setup.steps[index].name;

				return {
					panel: panel,
					step: stepslug
				};
			}
			
		}else{
			console.log('panel undefined');
		}
	}

	/**
	 * next collapses current panel and displays next
	 * @param  {object} panel
	 * @return {void}
	 */
	function next(panel){
		
		broadcast('onBeforeLoadNext', commonBroadcastResponse(panel));

		panel.find('.panel-body').addClass('collapse');

		panel.next().find('.panel-body').removeClass('collapse');
		
		broadcast('onAfterLoadNext', commonBroadcastResponse(panel));
	}

	/**
	 * prev collapses current panel and displays previous								
	 * @param  {object} panel
	 * @return {void}
	 */
	function prev(panel){
		

		broadcast('onBeforeLoadPrev', commonBroadcastResponse(panel));

		panel.find('.panel-body').addClass('collapse');

		panel.prev().find('.panel-body').removeClass('collapse');

		broadcast('onAfterLoadPrev', commonBroadcastResponse(panel));
	}

	/**
	 * has matches a pattern in a string
	 * @param  {string}  term
	 * @param  {string}  str
	 * @return {Boolean}
	 */
	function has(term, str){
		var patt = new RegExp(term);
		return patt.test(str);
	}

	/**
	 * prepareSteps - 
	 * @return {[type]} [description]
	 */
	function prepareSteps(){
		

		// build the steps
		for(var i=0, j = setup.steps.length; i < j; i++){

			if(typeof setup.steps[i] !== 'object'){
				continue;
			}

			var stepTemplate;

			setup.steps[i].id = i;

			// Based on template syntax look for either in document handlebars template or
			// or load from an already loaded external template file  
			
			if(/#/.test(setup.steps[i].template)){

				setup.steps[i].step = $(setup.steps[i].template).html();

				stepTemplate = Handlebars.compile(setup.steps[i].step);
				
				setup.steps[i].output = new Handlebars.SafeString(stepTemplate(setup.steps[i].context));
					
			}else{

				stepTemplate = setup.steps[i].template.render;

				setup.steps[i].output = new Handlebars.SafeString(stepTemplate(setup.steps[i].context));

			}

			if(i > 0) {
				setup.steps[i].validates = false;
			}
		}
	}

	function renderTemplate(){

		var self = this,
			template = '',
			stepsTemplate = setup.stepsTemplate;

		// Either compile in document template or assign the precomiled template to the template var
		if(/#/.test(stepsTemplate)){
			template = Handlebars.compile($(stepsTemplate).html());
		}else{
			template = stepsTemplate.render;
		}
		// append templated output to our wrapper div
		$(container).html(template(setup));
	}


	function setupPanels(){
		

		container.find('.panel-body').addClass('collapse');

		container.find('.panel-container:first').find('.panel-body').removeClass('collapse');

		// by default make all next button's disabled
		container.find(".next-step").attr("disabled", "disabled");

		// remove the prev button from first step panel
		container.find("#panel-0 .prev-step").hide();

		// by default lock panels
		container.find(".panel-container").addClass('locked');

		// before proceeding evaluate all steps as they might have been pre-populated
		container.find(".steps-container .panel-container").each(function(){

			var panel = $(this);
			//var lastValidPanel = null;
			var lastPanel = "panel-" + (setup.steps.length - 1);

			if(evaluate(panel) && panel.attr('id') !== lastPanel){
				next(panel);
			}else{
				return false;
			}
		});

		// Unlock first step 
		container.find(".steps-container .panel-container:first-child").removeClass('locked');
	}

	function captureChangeEvents(){

		container.on('keyup change', 'select, input, textarea', function(e){
			// add value to fields object
			fields[this.name] = this.value;

			handleChangeEvents(e);
		});
	}

	function handleChangeEvents(e){
		
		var panel = $(e.target).parents('.panel-container');

		var send = $.extend({ fields: fields, event: e }, commonBroadcastResponse(panel));

		broadcast('onFieldChange', send);

		evaluate(panel);
	}

	function captureClickEvents(){
		
		// Event Delegation
		container.on('click', function(e){

			var panel = $(e.target).parents(".panel-container");
			
			var send = $.extend({ e: e }, commonBroadcastResponse(panel));

			broadcast('onClickEvent', send);

			if(has("next-step", e.target.className) && !e.target.disabled){
				next(panel);
			} else if(has("prev-step", e.target.className) && !e.target.disabled){
				prev(panel);
			} else if(has("panel-heading", e.target.className) || has("panel-title", e.target.className)){

				if(!panel.hasClass("locked")){

					if(panel.find(".panel-body").hasClass("collapse")){
					
						// collapse this panel
						$('.panel-body').addClass('collapse');

						// expand this panel
						panel.find(".panel-body").removeClass('collapse');

						broadcast('onPanelExpanded', commonBroadcastResponse(panel));
					}
				}
			}
		});
	}

	function applyBehaviors(){
		
		captureChangeEvents();
		captureClickEvents();
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
			getStoredValues: getStoredValues
		};
	})();

	$.fn.steps = function( options ) {
		return this.each(function(){
			options.container = this;
			init( options );
		});
	};
}(jQuery));