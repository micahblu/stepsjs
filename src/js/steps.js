

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
		}

		Handlebars.registerHelper('list', function(context, options){

			var ret = '';
			for(var i=0, j=context.length; i<j; i++){

				ret +=	"\n<p>\n\t<label>" + context[i].label + "</label>\n";

				if(context[i].type == 'select'){
					ret += "\t<select name=\"name\" data-condition=\""  + (context[i].required ? 'required' : '') + "\">\n";
					if ( context[i].placeholder && context[i].placeholder.replace(/\s/, '') !== "" ) {
						ret += "\t\t<option value=\"\">" + context[i].placeholder + "</option>\n";
					}
					for(var option in context[i].options){
						ret += "\t\t<option name=\"" + option + "\">" + context[i].options[option] + "</option>\n";	
					}
					ret += "\t</select>\n";
				}else{
					ret += "\t<input type=\"" + context[i].type + "\" name=\"" + context[i].name + "\" data-condition=\""  + (context[i].required ? 'required' : '') + "\" />\n";
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

			//TODO: Add hook
			if(conditions === met){
				return true;
			}else{
				return false;
			}		
		}

		function unlockNextStep(panel){
			// Enable next button
			panel.find(".next-step").removeAttr("disabled");

			// Unlock the next step..
			panel.removeClass('locked');
			panel.next().removeClass('locked');
		}

		function lockNextStep(panel){
			// disable next step button
			panel.find(".next-step").attr("disabled", "disabled");
			//lock the next panel
			panel.next().addClass('locked');
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