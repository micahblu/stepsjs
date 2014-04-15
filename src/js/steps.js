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

		var fields = {},
				step,
				source,
				template,
				out,
				parent,
				source = this.html();

		/**
		 * evaluate evaluates validation conditions on panels and locks/unlocks steps accordingly	
		 * @param  {jQuery Object} panel
		 * @return {Boolean}
		 */
		function evaluate(panel){
			if(conditionsMet(panel)) {
				
				unlockNextStep(panel);

				broadcast('onPanelValidated', [fields]);

				return true;
			}
			else {
				lockNextStep(panel);
				return false;
			}
		}

		/**
		 * broadcast calls subscribed hook methods on specified events
		 * @param  {String} event
		 * @param  {Array} params
		 * @return {void}
		 */
		function broadcast(_event, params){
			//console.log(_event);
			if( setup.subscriptions ){
				var hooks = setup.subscriptions[_event]

				if(hooks){

					for(var i=0, j = hooks.length; i < j; i++){

						var func = setup[hooks[i]];
						if(typeof func === 'function'){
							//console.log(params[i]);
							var index = panel.attr('id').replace(/[^0-9]+/, ''),
							template = setup.steps[index].template;

							func.apply({event: _event}, [params[0], template]);
						}
					}
				}
			}
		}
 
		function applyTreatment(filterRef, filterEl){

			var treatments = setup.treatments[filterRef],
					ret;

			if(treatments){

				for(var i = 0, j = treatments.length; i < j; i++){
					var func = setup[treatments[i]];

					if(typeof func === 'function'){
						//console.log(filterEl);
						ret += func.apply(null, [filterEl]);
					}
				}
			}
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
			var conditions = 0,
					met = 0,
					regex = '',
					required;

			// check for conditions being met, if so allow continue button
			panel.find('input, select, textarea').each(function(index){

				required = this.getAttribute('data-condition');

				if(required){ 

					conditions++;
				
					if(setup.treatments && setup.treatments.onValidateField){

						if(applyTreatment('onValidateField', this)){
							met++;
						}
						/*
						if(setup.onValidateField.apply(this, [this.name, this.value])){
							met++;	
						}*/
					}else{

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
			for(var i=0; i < setup.steps.length; i++){	
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

		/**
		 * next collapses current panel and displays next
		 * @param  {object} panel
		 * @return {void}
		 */
		function next(panel){

			var index = panel.attr('id').replace(/[^0-9]+/, ''),
					template = setup.steps[index].template;

			broadcast('onBeforeLoadNext', [panel]);

			panel.find('.panel-body').addClass('collapse');
			panel.next().find('.panel-body').removeClass('collapse');
			
			broadcast('onAfterLoadNext', [panel]);
		}

		/**
		 * prev collapses current panel and displays previous								
		 * @param  {object} panel
		 * @return {void}
		 */
		function prev(panel){

			broadcast('onBeforeLoadPrev', [panel]);

			panel.find('.panel-body').addClass('collapse');
			panel.prev().find('.panel-body').removeClass('collapse');
			
			broadcast('onAfterLoadPrev', [panel]);
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
		 * content Handlebars helper that compiles nested templates
		 * @param  {object} options
		 * @return {HTMLString}
		 
		Handlebars.registerHelper('content', function(context, options){
			template = Handlebars.compile(this.step);
			return template();
		});*/

		/**
		 * list Handlebars helper that builds form fields from an object
		 * @param  {object} context
		 * @param  {object} options
		 * @return {HTMLString}
		 
		Handlebars.registerHelper('fields', function(context, options){

			var ret = '';
			for(var i=0, j=context.length; i<j; i++){

				ret +=	"\n<p>\n\t<label>" + context[i].label + "</label>\n";

				switch(context[i].type){

					case 'text':
						ret += "\t<input type=\"text\" name=\"" + context[i].name + "\" data-condition=\""  + (context[i].required ? 'required' : '') + "\" />\n";
						break;

					case 'radio':
						for(var option in context[i].options){
							ret += "\t<input type=\"radio\" name=\"" + context[i].name + "\" data-condition=\""  + (context[i].required ? 'required' : '') + "\" /> " + context[i].options[option] + "\n";
						}
						break;

					case 'textarea':
						ret += "\t<textarea name=\"" + context[i].name + "\" data-condition=\""  + (context[i].required ? 'required' : '') + "\"></textarea>\n"
						break;
				}
				ret += "</p>";
			}
			return ret;
		});*/
		Handlebars.registerHelper('list', function(context, options){
			console.log(context);
		});

		/**
		 * Handlebars 'select' Helper
		 * @param  {object} context	
		 * @return {Handlebars SafeString}
		 */
		Handlebars.registerHelper('select', function(context){

			var ret = '',
					index = parseInt(context.hash.step),
					options = setup.steps[index].context.options,
					defaultSelection = setup.steps[index].defaultSelection;

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

		/*
		Loop through steps in setup object 
		add id to each and optionally populate handlebars content
		 */
		setup.panel = '';
		for(var i=0; i < setup.steps.length; i++){

			setup.steps[i].id = i;

			if(setup.steps[i].template && $(setup.steps[i].template)){
				setup.steps[i].step = $(setup.steps[i].template).html();

				//console.log(setup.steps[i].step);
				template = Handlebars.compile(setup.steps[i].step);

				setup.steps[i].panelContent =  new Handlebars.SafeString(template(setup.steps[i].context));
				console.log(setup.steps[i]);
				console.log(setup.steps[i].panelContent);
				//console.log(setup.content);
			}

			if(i > 0) {
				setup.steps[i].validates = false;
			}
		}
	
		// compile handlebars template
		template = Handlebars.compile(source);

		// wrap out outbound content in a div used for jQuery
		out = document.createElement('div');

		//console.log(setup);

		// append templated output to our wrapper div
		$(out).append(template(setup));

		// by default make next button's disabled
		$(out).find(".next-step").attr("disabled", "disabled");

		// remove the prev button from first step panel
		$(out).find("#panel-0 .prev-step").hide();

		// by default lock panels
		$(out).find(".panel-container").addClass('locked');

		// add callback hook for last step next button
		$(out).find(".panel-container:last-child .next-step").on('click', function(e){
			callback.apply(this, [fields]);
		});

		// before proceeding evaluate all steps as they might have been pre-populated
		$(out).find(".steps-container .panel-container").each(function(index){
			panel = $(this);

			var lastValidPanel = null;

			if(evaluate(panel)){
				lastValidPanel = panel;
			}
			if(lastValidPanel){
				next(lastValidPanel);
			}
		});
		

		// Unlock first step 
		$(out).find(".steps-container .panel-container:first-child").removeClass('locked');

		// add event listeners to form fields
		$(out).find("input, select, textarea").each(function(index){

			$(this).attr("data-group", $(this).parents(".panel-container").attr("id"));

			$(this).on('keyup change', function(){
			
				panel = $(this).parents('.panel-container');

				// add value to fields object
				fields[this.name] = this.value;

				evaluate(panel);

			});
		});

		this.after(out);

		// Event Delegation
		$(".steps-container").on('click', function(e){

			panel = $(e.target).parents(".panel-container");

			broadcast('onClickEvent', [e]);

			if(has("next-step", e.target.className)){
				next(panel);
			} else if(has("prev-step", e.target.className)){
				prev(panel);
			}else if(has("panel-heading", e.target.className) || has("panel-title", e.target.className)){

				if(!panel.hasClass("locked")){
					if(panel.find(".panel-body").hasClass("collapse")){
						// collapse this panel
						$('.panel-body').addClass('collapse');

						// expand this panel
						panel.find(".panel-body").removeClass('collapse');

						broadcast('onPanelExpanded', [panel]);
					}
				}
			}
		});
	};
}(jQuery));