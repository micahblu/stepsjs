

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

				ret +=	"
					<p>
						<label>" + context[i].label + "</label>
						<input type=\"" + context[i].type + "\" name=\"" + context[i].name + "\" data-condition=\""  + (context[i].required ? 'required' : '') + "\" />
					</p>";
			}
			return ret;
		});



		template = Handlebars.compile(source);

		out = document.createElement('div');

		$(out).append(template(data));

		// by default make next button's disabled
		$(out).find(".next-step").attr("disabled", "disabled");

		// remove the prev button from first step panel
		$(out).find("#panel-0 .prev-step").hide();

		$(out).find(".panel-container").addClass('locked');

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
					if(this.getAttribute('data-condition') == 'required' && $(this).val().trim() !== ""){
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
				}else{
					parent.find(".next-step").attr("disabled", "disabled");
				}
			});
		});

		this.after(out);

		// Event Delegation
		$(".steps-container").on('click', function(e){

			if(has("next-step", e.target.className)){

				// collapse this panel
				$('.panel-body').addClass('collapse');

				// expand the next panel
				$(e.target).parents('.panel-container').next().find('.panel-body').removeClass('collapse');

			} else if(has("prev-step", e.target.className)){
				// collapse this panel
				$('.panel-body').addClass('collapse');

				// expand the next panel
				$(e.target).parents('.panel-container').prev().find('.panel-body').removeClass('collapse');
			}
			//if($(this).parents(".panel-container").hasClass('locked'));
			//console.log(e.target.className);
			
		});

		function has(term, str){
			var patt = new RegExp(term);
			return patt.test(str);
		}
	};
}(jQuery));