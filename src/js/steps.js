
(function($){
	$.fn.steps = function(setup, callback) {

		var fields = {},
				conditions,
				step,
				source,
				template,
				out,
				parent,
				met;
		
		source = this.html();

		for(var i=0; i < setup.steps.length; i++){
			// add id to each object
			setup.steps[i].id = i;
			setup.steps[i].step = $(setup.steps[i].content).html();

			if(i > 0) {
				setup.steps[i].validates = false;
			}
		}

		Handlebars.registerHelper('content', function(options){
			template = Handlebars.compile(this.step);
			return template();
		});

		Handlebars.registerHelper('list', function(context, options){

			var ret = '';
			for(var i=0, j=context.length; i<j; i++){

				ret +=	"\n<p>\n\t<label>" + context[i].label + "</label>\n";

				switch(context[i].type){

					case 'select': 
						ret += "\t<select name=\"name\" data-condition=\""  + (context[i].required ? 'required' : '') + "\">\n";
						if ( context[i].placeholder && context[i].placeholder.replace(/\s/, '') !== "" ) {
							ret += "\t\t<option value=\"\">" + context[i].placeholder + "</option>\n";
						}
						for(var option in context[i].options){
							ret += "\t\t<option name=\"" + option + "\">" + context[i].options[option] + "</option>\n";	
						}
						ret += "\t</select>\n";
						break;

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
		});

		// compile handlebars template
		template = Handlebars.compile(source);

		// wrap out outbound content in a div used for jQuery
		out = document.createElement('div');

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
		})

		// Unlock first step 
		$(out).find(".steps-container .panel-container:first-child").removeClass('locked');

		// add event listeners to form fields
		$(out).find("input, select, textarea").each(function(index){
			$(this).attr("data-group", $(this).parents(".panel-container").attr("id"));

			$(this).on('keyup change', function(){
				panel = $(this).parents('.panel-container');

				// add value to fields object
				fields[this.name] = this.value;

				if(conditionsMet(panel)) {

					if(setup.onPreLoadNext){
						setup.onPreLoadNext.apply(null, [fields]);
					}
					unlockNextStep(panel);
					if(setup.onPostLoadNext){
						setup.onPostLoadNext.apply(null, [fields]);
					}
				}
				else { 
					lockNextStep(panel); 
				}
			});
		});

		this.after(out);

		// Event Delegation
		$(".steps-container").on('click', function(e){

			step = $(e.target).parents(".panel-container");


			if(setup.steps[step.attr("id").replace(/[^0-9]+/, '')].onClickEvent){
				//console.log(e.target);
				setup.steps[step.attr("id").replace(/[^0-9]+/, '')].onClickEvent.apply(step, [e]);
			}

			if(has("next-step", e.target.className)){
				next(e);
			} else if(has("prev-step", e.target.className)){
				prev(e);
			}else if(has("panel-heading", e.target.className) || has("panel-title", e.target.className)){

				if(!step.hasClass("locked")){
					if(step.find(".panel-body").hasClass("collapse")){
						// collapse this panel
						$('.panel-body').addClass('collapse');

						// expand this panel
						step.find(".panel-body").removeClass('collapse');
					}
				}
			}
		});

		function conditionsMet(panel){

			if(!panel){
				return false;
			}
			//set our conditions and met vars
			conditions = 0;

			met = 0;	

			// check for conditions being met, if so allow continue button
			panel.find('input, select, textarea').each(function(index){
				
				if(this.getAttribute('data-condition') === 'required'){ 
					conditions++;
					if($(this).val().trim() !== ""){
						met++;
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

		function unlockNextStep(panel){

			// Enable next button
			panel.find(".next-step").removeAttr("disabled");

			// Unlock the next step..
			panel.next().removeClass('locked');

			// unlock all next panels where conditions are met
			for(var i=0; i < setup.steps.length; i++){	
				if(setup.steps[i].validates){
					//console.log("#panel-" + (setup.steps[i].id + 1)  + " should be unloacked");
					$("#panel-" + (setup.steps[i].id + 1) ).removeClass('locked');
				}
			}
		}

		function lockNextStep(panel){
			// disable next step button
			panel.find(".next-step").attr("disabled", "disabled");

			//lock the next panel
			panel.nextAll().addClass('locked');
		}

		function next(e){
			// collapse this panel
			$('.panel-body').addClass('collapse');

			// expand the next panel
			$(e.target).parents('.panel-container').next().find('.panel-body').removeClass('collapse');
		}

		function prev(e){
			// collapse this panel
			$('.panel-body').addClass('collapse');

			// expand the next panel
			$(e.target).parents('.panel-container').prev().find('.panel-body').removeClass('collapse');
		}

		function has(term, str){
			var patt = new RegExp(term);
			return patt.test(str);
		}
	};
}(jQuery));