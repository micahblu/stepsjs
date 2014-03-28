

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
			data.steps[i].class = data.steps[i].class + ' locked';
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
					parent.find('.locked').removeClass('locked');
					parent.next().find('.locked').removeClass('locked');

					// Optionally automatically open the next step? 
				}else{
					parent.find(".next-step").attr("disabled", "disabled");
				}
			});
		});

		this.after(out);

		// Handle Events
		$(".panel-header").on('click', function(e){
			if($(this.getAttribute("data-target")).find('.panel-body').hasClass('locked')){
				return;	
			}
			if($(this.getAttribute("data-target")).find('.panel-body').hasClass('collapse')){
				$('.panel-body').addClass('collapse');
				$(this.getAttribute("data-target")).find('.panel-body').removeClass('collapse');
			}
		});

		function contains(needle, str){
			var patt = new RegExp(needle);
			return patt.test(str);
		}
	};
}(jQuery));