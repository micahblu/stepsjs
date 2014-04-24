/**
 * Steps js
 *
 * Build your form in steps with steps js :)
 * @author : micahblu @ micahblu.com | github.com/micahblu
 * @license http://opensource.org/licenses/MIT MIT License
 * @version 0.0.4
 *
 * Hooks
 *  - onPanelValidated
 *  - onBeforeLoadNext
 *  - onAfterLoadNext
 *  - onBeforeLoadPrev
 *  - onAfterLoadPrev
 *  - onClickEvent
 *  - onPanelExpanded
 *
 * Filters
 *  - onValidateField
 * 
 */
(function($){
	
	'use strict';

	var stepsjs = {};

	$.steps = function( func, param ){

		var allowed = ['goto'];

		if(allowed.has(func)){
			stepsjs[func].apply(stepsjs, [param]);
		}else{
			console.log('Method not found');
		}
	
	};

	$.fn.steps = function( options ) {

		stepsjs = {

			fields: {},
			
			step: '',

			template: '',
			
			out: '',
			
			parent: {},
			
			container: {},

			setup: {},

			init: function( options ){

				var self = this;

				self.regiesterHelpers();

				self.container = $(options.container);

				self.setup = options;

				self.prepareSteps();

				self.renderTemplate();

				self.setupPanels();

				self.applyBehaviors();

			},

			goto: function(step){
				var self = this;

				// panel index will be at a panel index of minus 2
				// this is due to the fact steps start @ 1 and panel id's start at 0 
				// and becuase next is implemented for the behaviour so the panel before the 
				// requested panel needs to be passed for reference
				var panelIndex = (parseInt(step.replace("step-", "")) - 1);
				//console.log('panel for step ' + step.replace("step-", "") + ' is: ' + '#panel-' + panelIndex);

				var panel = $("#panel-" + panelIndex);

				$('.panel-body').addClass('collapse');

				panel.find('.panel-body').removeClass('collapse');

			},

			regiesterHelpers: function(){
				
				/**
				 * Handlebars 'select' Helper
				 * @param  {object} context	
				 * @return {Handlebars SafeString}
				 */
				Handlebars.registerHelper('select', function(context){

					var ret = '',
							index = parseInt(context.hash.step),
							options = self.setup.steps[index].context.options,
							defaultSelection = self.setup.steps[index].context.defaultSelection;

					if(context.hash.step){
						ret += '<select';

						for(var field in context.hash){
							ret += ' ' + field + '=' + '"' + context.hash[field] + '"';
						}
						ret +='>';		
						for(var i=0; i < options.length; i++){
							ret += '<option value="' + options[i].value + '" ' + (defaultSelection == options[i].value ? 'selected="selected"' : '') + '>' + options[i].label + '</options>';
						}
						ret += '</select>';
					}

					return new Handlebars.SafeString(ret);
				});
			},


			/**
			 * evaluate evaluates validation conditions on panels and locks/unlocks steps accordingly	
			 * @param  {jQuery Object} panel
			 * @return {Boolean}
			 */
			evaluate: function(panel){
				var self = this;
				if(self.conditionsMet(panel)) {

					self.unlockNextStep(panel);
								
					var send = $.extend({
						values: self.fields
					}, self.commonBroadcastResponse(panel));

					self.broadcast('onPanelValidated', send);

					return true;
				}
				else {
					self.lockNextStep(panel);
					return false;
				}
			},

			/**
			 * broadcast calls subscribed hook methods on specified events
			 * @param  {String} _event
			 * @param  {Array} params
			 * @return {void}
			 */
			broadcast: function(_event, _with){

				//console.log('Broadcast: ' + _event);
				//console.log(_with	);
				//
				var self = this;

				if( self.setup.subscriptions ){
					var hooks = self.setup.subscriptions[_event]

					if(hooks){

						for(var i=0, j = hooks.length; i < j; i++){

							var func = self.setup[hooks[i]];

							if(typeof func === 'function'){

								// check to see if a jQuery panel element is passed

								var response = func.apply({event: _event}, [ _with ] );

								// response may be a jQuery promise if so deal with it
								if(response && response.then){

									response.done(function(data){

										if(data.request === 'update-step'){

											var panelIndex = (data.step.replace("step-", ""));

											var panelID = "#panel-" + panelIndex;

											var html = self.setup.steps[panelIndex].template.render(data.context);
											
											$(panelID).find('.panel-content').html(html);
										}
									});
								}
							}
						}
					}
				}
			},
	 
			applyTreatment: function(filterRef, filterEl){
				var self = this;
				var treatments = self.setup.treatments[filterRef],
						ret;

				if(treatments){

					for(var i = 0, j = treatments.length; i < j; i++){
						var func = this.setup[treatments[i]];
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
			},

			/**
			 * conditionsMet
			 * @param  {jQuery object} panel
			 * @return {Boolean}
			 */
			conditionsMet: function(panel){

				if(!panel){	
					return false;
				}
				var self = this;
				//set our conditions and met vars
				var conditions = 0,
						met = 0,
						regex = '',
						required,
						handler,
						self = this;

				// check for conditions being met, if so allow continue button
				panel.find('input, select, textarea').each(function(index){

					required = this.getAttribute('data-condition');

					if(required){ 

						conditions++;

						if(self.setup.treatments && setup.treatments.onValidateField){	
							if(applyTreatment('onValidateField', this)){
								met++;
							}
						}else{

							handler = this.getAttribute('data-validator');

							if(handler){
								if(!self.setup[handler]){
									console.log('[Stepsjs Alert]: A custom validation handler was defined for "' + this.name + '" but no handler method was declared in the configuration object');
								}else{
									if(self.setup[handler].apply(null, [this])){
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
										met++;
									}
								}
								else if($(this).val().trim() !== ""){
									met++;
								}
							}
						}
					}
				});

				var r = [];
				panel.find('input[type="radio"]').each(function(){

					// Find condition to meet
					if(this.getAttribute('data-condition') == 'required' && !r[this.name]){
						r[this.name] = [];
						conditions++;
					}
					// Collect met conditions
					if(this.getAttribute('data-condition') == 'required' && r[this.name] && this.checked){
						met++;
					}
				});

				//TODO: Add hook
				if(conditions === met){
					self.setup.steps[panel.attr('id').replace(/[^0-9]+/, '')].validates = true;
					return true;
				}else{
					self.setup.steps[panel.attr('id').replace(/[^0-9]+/, '')].validates = false;
					return false;
				}		
			},

			/**
			 * unlockNextStep unlocks all validated subsequent steps
			 * @param  {jQuery object} panel
			 * @return {void}
			 */
			unlockNextStep: function(panel){
				var self = this;
				// Enable next button
				panel.find(".next-step").removeAttr("disabled");

				// Unlock the next step..
				panel.next().removeClass('locked');

				// unlock all next panels where conditions are met
				for(var i=0; i < setup.steps.length; i++){	
					if(self.setup.steps[i].validates){
						$("#panel-" + (this.setup.steps[i].id + 1) ).removeClass('locked');
					}
				}
			},

			/**
			 * lockNextStep locks all subsequent panels
			 * @param  {jQuery object} panel
			 * @return {void}
			 */
			lockNextStep: function(panel){
				panel.find(".next-step").attr("disabled", "disabled");
				panel.nextAll().addClass('locked');
			},


			commonBroadcastResponse: function(panel){
				var self = this;
				if(panel){
					if(panel.attr('id')){

						var index = panel.attr('id').replace(/[^0-9]+/, '');
						var stepslug = self.setup.steps[index].name;

						return {
							panel: panel,
							step: stepslug
						}
					}
					
				}else{
					console.log('panel undefined');
				}
			},

			/**
			 * next collapses current panel and displays next
			 * @param  {object} panel
			 * @return {void}
			 */
			next: function(panel){
				var self = this;

				self.broadcast('onBeforeLoadNext', self.commonBroadcastResponse(panel));

				panel.find('.panel-body').addClass('collapse');

				panel.next().find('.panel-body').removeClass('collapse');
				
				self.broadcast('onAfterLoadNext', self.commonBroadcastResponse(panel));
			},

			/**
			 * prev collapses current panel and displays previous								
			 * @param  {object} panel
			 * @return {void}
			 */
			prev: function(panel){
				var self = this;

				self.broadcast('onBeforeLoadPrev', self.commonBroadcastResponse(panel));

				panel.find('.panel-body').addClass('collapse');

				panel.prev().find('.panel-body').removeClass('collapse');

				self.broadcast('onAfterLoadPrev', self.commonBroadcastResponse(panel));
			},

			/**
			 * has matches a pattern in a string
			 * @param  {string}  term
			 * @param  {string}  str
			 * @return {Boolean}
			 */
			has: function(term, str){
				var patt = new RegExp(term);
				return patt.test(str);
			},

			
			prepareSteps: function(){
				var self = this;
				/*
				Loop through steps in setup object 
				add id to each and optionally populate handlebars content
				*/
				// build the steps
				for(var i=0, j = this.setup.steps.length; i < j; i++){

					if(typeof this.setup.steps[i] !== 'object'){
						continue;
					} 

					var stepTemplate;

					self.setup.steps[i].id = i;

					// Based on template syntax look for either in document handlebars template or
					// or load from an already loaded external template file  

					if(/#/.test(self.setup.steps[i].template)){

						self.setup.steps[i].step = $(self.setup.steps[i].template).html();

						stepTemplate = Handlebars.compile(self.setup.steps[i].step);
						
						self.setup.steps[i].panelContent = new Handlebars.SafeString(stepTemplate(self.setup.steps[i].context));
					
					}else{

						stepTemplate = self.setup.steps[i].template.render;

						self.setup.steps[i].panelContent = new Handlebars.SafeString(stepTemplate(self.setup.steps[i].context));

					}

					if(i > 0) {
						self.setup.steps[i].validates = false;
					}
				}
			},

			renderTemplate: function(){
				var self = this,
						template = '';
				// Either compile in document template or assign the precomiled template to the template var
				if(/#/.test(this.setup.steps.containerTemplate)){
					template = Handlebars.compile($(containerTemplate).html());
				}else{
					template = this.setup.containerTemplate.render;
				}
				// append templated output to our wrapper div
				$(self.container).html(template(this.setup));
			},


			setupPanels: function(){
				var self = this;

				// by default make all next button's disabled
				self.container.find(".next-step").attr("disabled", "disabled");

				// remove the prev button from first step panel
				self.container.find("#panel-0 .prev-step").hide();

				// by default lock panels
				self.container.find(".panel-container").addClass('locked');

				// before proceeding evaluate all steps as they might have been pre-populated
				self.container.find(".steps-container .panel-container").each(function(index){

					var panel = $(this);
					var lastValidPanel = null;
					var lastPanel = "panel-" + (self.setup.steps.length - 1);

					if(self.evaluate(panel) && panel.attr('id') != lastPanel){
						self.next(panel);
					}else{
						return false;
					}
				});

				// Unlock first step 
				self.container.find(".steps-container .panel-container:first-child").removeClass('locked');
			},

			captureChangeEvents: function(){
				var self = this;

				self.container.on('keyup change', 'input, select, textarea', function(e){

					var panel = $(this).parents('.panel-container');

					// add value to fields object
					self.fields[this.name] = this.value;

					self.broadcast('onFieldChange', { fields: self.fields });

					self.evaluate(panel);

				});
			},

			captureClickEvents: function(){
				var self = this;
				// Event Delegation
				self.container.on('click', function(e){

					var panel = $(e.target).parents(".panel-container");

					var send = $.extend({
						e: e
					}, self.commonBroadcastResponse(panel));

					self.broadcast('onClickEvent', send);

					if(self.has("next-step", e.target.className)){
						self.next(panel);
					} else if(self.has("prev-step", e.target.className)){
						self.prev(panel);
					}else if(self.has("panel-heading", e.target.className) || self.has("panel-title", e.target.className)){

						if(!panel.hasClass("locked")){

							if(panel.find(".panel-body").hasClass("collapse")){
							
								// collapse this panel
								$('.panel-body').addClass('collapse');

								// expand this panel
								panel.find(".panel-body").removeClass('collapse');

								self.broadcast('onPanelExpanded', self.commonBroadcastResponse(panel));
							}
						}
					}
				});
			},

			applyBehaviors: function(){
				var self = this;

				self.captureChangeEvents();
	
				self.captureClickEvents();
				
			}
		}

		return this.each(function(){
				options.container = this;
				stepsjs.init( options );			
    }); 

	};
}(jQuery));