
(function($){
	$.fn.steps = function(data) {

		var steps = [],
				conditions,
				source,
				template
				out,
				parent,
				conditions,
				met;
		
		source = this.html();

		for(var i=0; i < data.steps.length; i++){
			// add id to each object
			data.steps[i].id = i;
			if(i > 0) {
				data.steps[i].locked = true;
			}
		}

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
		$(out).append(template(data));

		// by default make next button's disabled
		$(out).find(".next-step").attr("disabled", "disabled");

		// remove the prev button from first step panel
		$(out).find("#panel-0 .prev-step").hide();

		// by default lock panels
		$(out).find(".panel-container").addClass('locked');

		// Unlock first step 
		$(out).find(".steps-container .panel-container:first-child").removeClass('locked');

		// add event listeners to form fields
		$(out).find("input, select, textarea").each(function(index){
			$(this).attr("data-group", $(this).parents(".panel-container").attr("id"));

			$(this).on('keyup change', function(){
				panel = $(this).parents('.panel-container');
				if(conditionsMet(panel)) { unlockNextStep(panel); }
				else { lockNextStep(panel); }
			});
		});

		this.after(out);

		// Event Delegation
		$(".steps-container").on('click', function(e){

			if(has("next-step", e.target.className)){
				next(e);
			} else if(has("prev-step", e.target.className)){
				prev(e);
			}else if(has("panel-header", e.target.className)){

				if(!$(e.target).parents(".panel-container").hasClass("locked")){
					if($(e.target).parents(".panel-container").find(".panel-body").hasClass("collapse")){
						// collapse this panel
						$('.panel-body').addClass('collapse');

						// expand this panel
						$(e.target).parents(".panel-container").find(".panel-body").removeClass('collapse');
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
				conditions++;
				if(this.getAttribute('data-condition') === 'required' && $(this).val().trim() !== ""){
					met++;
				}
			});

			var r = [];
			panel.find('input[type="radio"]').each(function(){

				// Find condition to meet
				if(this.getAttribute('data-condition') == 'required' && !r[this.name]){
					r[this.name] = [];
					conditions++;
					//console.log('adding condition for ' + this.name);
				}

				// Collect met conditions
				if(this.getAttribute('data-condition') == 'required' && r[this.name] && this.checked){
					met++;
				}

			});

			//TODO: Add hook
			if(conditions === met){
				data.steps[panel.attr('id').replace(/[^0-9]+/, '')].locked = false;
				return true;
			}else{
				data.steps[panel.attr('id').replace(/[^0-9]+/, '')].locked = true;
				return false;
			}		
		}

		function unlockNextStep(panel){
			// Enable next button
			panel.find(".next-step").removeAttr("disabled");

			// Unlock the next step..
			panel.next().removeClass('locked');

			// unlock all next panels where conditions are met
			for(var i=0; i < data.steps.length; i++){
				if(!data.steps[i].locked){
					console.log("#panel-" + data.steps[i].id);
					$("#panel-" + data.steps[i].id).removeClass('locked');
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