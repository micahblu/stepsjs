

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
					ret += "\t<select name=\"name\">\n";
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

		// add keyup listeners to input fields
		$(out).find("input[type='text']").each(function(index){
			$(this).attr("data-group", $(this).parents(".panel-container").attr("id"));

			$(this).on('keyup', function(){
				//set our conditions and met vars
				conditions = 0;
				met = 0;

				parent = $(this).parents('.panel-container');

				// check for conditions being met, if so allow continue button
				parent.find('input').each(function(index){
					conditions++;
					if(this.getAttribute('data-condition') === 'required' && $(this).val().trim() !== ""){
						met++;
					}
				});

				//TODO: Add hook
				if(conditions === met){
					// Enable next button
					parent.find(".next-step").removeAttr("disabled");

					// Unlock the next step..
					parent.removeClass('locked');
					parent.next().removeClass('locked');

					// Optionally automatically open the next step? 
				}
				// Conditions No longer met disable continue and lock the next panel
				else{
					// disable next step button
					parent.find(".next-step").attr("disabled", "disabled");
					//lock the next panel
					parent.next().addClass('locked');
				}
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