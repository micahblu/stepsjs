/**
 * Steps js
 *
 * Build your form in steps with steps js :)
 * @author : micahblu @ micahblu.com | github.com/micahblu
 * @license http://opensource.org/licenses/MIT MIT License
 * @version 0.0.4
 *
 * Hooks
 *  - onPanelValidate
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

	$.fn.steps = function(setup, callback) {

		var stepsjs = {

			fields: {},
			
			step: '',

			template: '',
			
			out: '',
			
			parent: {},
			
			container: {},

			setup: {},

			self: {},

			init: function(setup, container){

				self = this;

				self.regiesterHelpers();

				self.container = $(container);

				self.setup = setup;

				self.prepareSteps();

				self.renderTemplate();

				self.setupPanels();

				self.applyBehaviours();

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

				if(self.conditionsMet(panel)) {

					self.unlockNextStep(panel);

					self.broadcast('onPanelValidated', [self.fields]);

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
			broadcast: function(_event, params){

				console.log('Broadcast: ' + _event);
				console.log(params);

				if( self.setup.subscriptions ){
					var hooks = self.setup.subscriptions[_event]

					if(hooks){

						for(var i=0, j = hooks.length; i < j; i++){

							var func = self.setup[hooks[i]];
							if(typeof func === 'function'){

								// TODO !! where's panel declared?
								var index = panel.attr('id').replace(/[^0-9]+/, ''),
								
								stepslug = self.setup.steps[index].name;

								response = func.apply({event: _event}, [params[0], stepslug]);

								// response may be a jQuery promise if so deal with input
								if(response && response.then){

									response.done(function(data){

										if(data.request === 'update-step'){

											var panelIndex = (data.step.replace("step-", ""));

											var panelID = "#panel-" + panelIndex;

											var html = self.setup.steps[panelIndex].template.render(data.context);
											
											$(panelID).find('.panel-body').html(html);
										}

									});
								}else{
									
								}

							}
						}
					}
				}
			},
	 
			applyTreatment: function(filterRef, filterEl){

				var treatments = this.setup.treatments[filterRef],
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

			/**
			 * next collapses current panel and displays next
			 * @param  {object} panel
			 * @return {void}
			 */
			next: function(panel){

				var index = panel.attr('id').replace(/[^0-9]+/, ''),
						template = setup.steps[index].template;

				this.broadcast('onBeforeLoadNext', [panel]);

				panel.find('.panel-body').addClass('collapse');

				panel.next().find('.panel-body').removeClass('collapse');
				
				this.broadcast('onAfterLoadNext', [panel]);
			},

			/**
			 * prev collapses current panel and displays previous								
			 * @param  {object} panel
			 * @return {void}
			 */
			prev: function(panel){

				this.broadcast('onBeforeLoadPrev', [panel]);
				panel.find('.panel-body').addClass('collapse');

				panel.prev().find('.panel-body').removeClass('collapse');
				this.broadcast('onAfterLoadPrev', [panel]);
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

					this.setup.steps[i].id = i;

					// Based on template syntax look for either in document handlebars template or
					// or load from an already loaded external template file  

					if(/#/.test(this.setup.steps[i].template)){

						this.setup.steps[i].step = $(this.setup.steps[i].template).html();

						stepTemplate = Handlebars.compile(this.setup.steps[i].step);
						
						this.setup.steps[i].panelContent = new Handlebars.SafeString(stepTemplate(this.setup.steps[i].context));
					
					}else{

						stepTemplate = this.setup.steps[i].template.render;

						this.setup.steps[i].panelContent = new Handlebars.SafeString(stepTemplate(this.setup.steps[i].context));

					}

					if(i > 0) {
						this.setup.steps[i].validates = false;
					}
				}
			},

			renderTemplate: function(){

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

				// by default make all next button's disabled
				self.container.find(".next-step").attr("disabled", "disabled");

				// remove the prev button from first step panel
				self.container.find("#panel-0 .prev-step").hide();

				// by default lock panels
				self.container.find(".panel-container").addClass('locked');

				// add callback hook for last step next button
				self.container.find(".panel-container:last-child .next-step").on('click', function(e){
					callback.apply(this, [self.fields]);
				});

				// before proceeding evaluate all steps as they might have been pre-populated
				self.container.find(".steps-container .panel-container").each(function(index){

					//console.log(self);

					panel = $(this);
					var lastValidPanel = null;

					if(self.evaluate(panel)){
						self.next(panel);
					}else{
						return false;
					}
				});

				// Unlock first step 
				self.container.find(".steps-container .panel-container:first-child").removeClass('locked');
			},

			applyBehaviours: function(){
				var self = this;
				self.container.find("input, select, textarea").each(function(){
					$(this).on('keyup change', function(){

						var panel = $(this).parents('.panel-container');

						// add value to fields object
						self.fields[this.name] = this.value;

						self.broadcast('onFieldChange', [self.fields]);

						self.evaluate(panel);

					});
				});

				// Event Delegation
				self.container.on('click', function(e){

					var panel = $(e.target).parents(".panel-container");

					self.broadcast('onClickEvent', [e]);

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

								self.broadcast('onPanelExpanded', [panel]);
							}
						}
					}
				});
			}
		}

		return this.each(function(container){
			stepsjs.init(setup, this);
    }); 

	};
}(jQuery));