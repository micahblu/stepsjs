

(function($){
	$.fn.steps = function(data) {

		var steps = [], 	
				conditions,
				source,
				template
				out;
		
		source = this.html();

		for(var i=0; i < data.steps.length; i++){
			// add id to each object
			data.steps[i].id = i;
			data.steps[i].class = data.steps[i].class + ' locked';
		}


		Handlebars.registerHelper('list', function(context, options){

			var ret = '';
			for(var i=0, j=context.length; i<j; i++){
				console.log(context);
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
				console.log(this.getAttribute("data-group"));
			});
		});

		this.after(out);

		// Handle Events
		$(".panel-header").on('click', function(e){
			if($(this.getAttribute("data-target")).find('.panel-body').hasClass('locked')){
				//return;	
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