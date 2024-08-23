var svg = d3.select('#svg1');
var svg2 = d3.select('#svg2');

var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var svg2Width = +svg2.attr('width');
var svg2Height = +svg2.attr('height');

var padding = {t: 20, r: 60, b: 20, l: 20};
// var cellPadding = 20;

var scatter = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

var bars = svg2;

var dataAttributes = ['duration', 'aspect_ratio', 'imdb_score', 'budget', 'gross', 'num_user_for_reviews', 
    'facenumber_in_poster', 'num_voted_users'];

var barAttributes = ['movie_facebook_likes', 'cast_total_facebook_likes', 'director_facebook_likes', 'actor_3_facebook_likes', 
     'actor_2_facebook_likes', 'actor_1_facebook_likes'];

var yearArr = ['2010', '2011', '2012', '2013', '2014', '2015', '2016'];

var cellWidth = (svgWidth - 3 * padding.r);
var cellHeight = (svgHeight - padding.t - padding.b);

var xScale = d3.scaleLinear().range([0, svgWidth - 4 * padding.r]);
var yScale = d3.scaleLinear().range([svgHeight - padding.t - padding.t, 0]);

var xScale2 = d3.scaleLinear().range([0, svg2Width -  3 * padding.r]);
var yScale2 = d3.scaleBand().range([svgHeight - 4 * padding.t, 0]);

var xAxis = d3.axisBottom(xScale).ticks(8).tickSize(-cellHeight, 0, 0);
var yAxis = d3.axisLeft(yScale).ticks(8).tickSize(-cellWidth + padding.r, 0, 0);

var xAxis2 = d3.axisBottom(xScale2).ticks(6).tickSize(-cellHeight + padding.r, 0, 0);
var yAxis2 = d3.axisLeft(yScale2).ticks(8).tickSize(-cellWidth + padding.r, 0, 0);

var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

var extentByAttribute = {};
var movieMaxLikes = [];

// var barWidth = (svgWidth - padding.l - padding.l) / 5;
var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-12, 0])
    .html(function(event, d) {
        // Inject html, when creating your html I recommend editing the html within your index.html first
        return "<h5>"+d['movie_title']+" ("+d['content_rating']+")"+"</h5>"
        });

var clicked = false;
var movies;
var tempMovies;

d3.csv('movies.csv', dataPreprocessor).then(function(dataset) {
    movies = dataset;
    tempMovies = movies;

    dataAttributes.forEach(function(attribute){
        extentByAttribute[attribute] = d3.extent(dataset, function(d){
            return d[attribute];
        });
    });       
    
    //console.log(extentByAttribute)

    updateScatter();
});

function updateScatter() {
    var select = d3.select('#xAxisAttrSelector').node();
    var xCategory = select.options[select.selectedIndex].value;

    xScale.domain(extentByAttribute[xCategory])

    var select = d3.select('#yAxisAttrSelector').node();
    var yCategory = select.options[select.selectedIndex].value;

    yScale.domain(extentByAttribute[yCategory])

    var select = d3.select('#yearAttrSelector').node();
    var filterDots = select.options[select.selectedIndex].value;

    if (filterDots != 'All') {
        movies = movies.filter(function(d) {
            return d.title_year == filterDots;
        })
    }

    scatter.selectAll('.axis').remove()
    scatter.selectAll('.dot').remove()

    scatter.append('rect')
        .attr('class', 'frame')
        .attr('width', svgWidth - 4 * padding.r)
        .attr('height', svgHeight - padding.l - padding.l)
        .attr('transform', 'translate('+[2* padding.l,0]+')')

    scatter.selectAll('.axis')
        .data([0])
        .enter()
        .append('g')
        .attr('class', 'axis')
        .attr('transform', function(d,i) {
            return 'translate('+[2 * padding.l,svgHeight - padding.t - padding.b]+')'
        })
        .call(xAxis)
        .style("fill", 0)

    scatter.append('g')
        .attr('class', 'axis')
        .call(yAxis)
        .attr('transform', 'translate('+[2 * padding.l, 0]+')')

    scatter.append('g')
        .attr('transform', 'translate('+[svgWidth - 2 * padding.r - padding.l,0]+')')
        .append('text')
        .text("Movie Year")
        
    var legend = scatter.append('g').selectAll('.legend')
        .data(yearArr)
        .enter()

    legend.append('rect')
        .attr('transform', function(d, i) { 
            return'translate('+[svgWidth - 7 * padding.l + 5,10 + i * 40]+')'
        })
        .attr('height', 30)
        .attr('width', 30)
        .style("fill", function(d) { return colorScale(d) })
        
    legend.append('text')
        .text(function(d) {return d})
        .attr('transform', function(d, i) { 
            return'translate('+[svgWidth - 5 * padding.l, 30 + i * 40]+')'
        })
        
    var dots = scatter.selectAll('.dot')
        .data(movies)
        .enter()
        .append('circle')
        .attr('class', 'dot selected')
        .attr('cx', function(d, i) { return xScale(d[xCategory]) })
        .attr('cy', function(d, i) { return yScale(d[yCategory]) })
        .style("fill", function(d) { return colorScale(d.title_year); })
        .attr('transform', 'translate('+[2 * padding.l, 0]+')')
        .attr('r', 4);

    dots.on('mouseover', toolTip.show)
        .on('mouseout', toolTip.hide);

    movies = tempMovies;

    svg.call(toolTip);

    dots.on('click', function(d) {
        drawGraph(d3.select(this)._groups[0][0].__data__)
    })

    function drawGraph(dot) {
        movieMaxLikes = []
        barAttributes.forEach(function(d, i) {
            //console.log(d)
            //console.log(dot[d])
            movieMaxLikes[i] = dot[d] 
        })

        xScale2.domain([0, d3.max(movieMaxLikes)])

        yScale2.domain(barAttributes)

        console.log(movieMaxLikes)

        bars.selectAll('.barchart').remove()

        bars.append('rect')
            .attr('class', 'frame barchart')
            .attr('width', svgWidth - 6 * padding.r + padding.l + 9)
            .attr('height', svgHeight - 6 * padding.l + 4)
            .attr('transform', 'translate('+[6 * padding.l,2 * padding.l - 4]+')')

        bars.append('g')
            .attr('class', 'barchart')
            .append('text')
            .text(dot.movie_title)
            .attr("transform", 'translate('+[padding.r, padding.t]+')')

        bars.selectAll('.axis')
            .data([0])
            .enter()
            .append('g')
            .attr('class', 'axis barchart')
            .attr('transform', function(d,i) {
                return 'translate('+[6 * padding.l,svg2Height - 2 * padding.t - padding.b - 4]+')'
            })
            .call(xAxis2)
            .style("fill", 0)
        
        bars.append('g')
        .attr('class', 'axis barchart')
        .call(yAxis2)
        .attr('transform', 'translate('+[2 * padding.r, padding.l - 4]+')')

        var bargraph = bars.append('g').selectAll('bars')
            .data(barAttributes)
            .enter()
            .append('rect')
            .attr('class', 'bars barchart')
            .attr('height', 51)
            .attr('width', function(d, i) {
                return (movieMaxLikes[movieMaxLikes.length - 1 - i] * 410 / d3.max(movieMaxLikes))
            })
            .attr('transform', function(d, i) { 
                return 'translate('+[2 * padding.r, 35 + 87 * i]+')'
            })
            .style("fill", 'rgb(0,0,139)')
            
    }

    dots.on('dblclick', function(d) {
        bars.selectAll('.barchart').remove()
    })
}

function dataPreprocessor(row) {
    return {
        'color': row['color'],
        'director_name': row['director_name'],
        'num_critic_for_reviews': +row['num_critic_for_reviews'],
        'duration': +row['duration'],
        'director_facebook_likes': +row['director_facebook_likes'],
        'actor_3_facebook_likes': +row['actor_3_facebook_likes'],
        'actor_2_name': row['actor_2_name'],
        'actor_1_facebook_likes': +row['actor_1_facebook_likes'],
        'gross': +row['gross'],
        'genres': row['genres'],
        'actor_1_name': row['actor_1_name'],
        'movie_title': row['movie_title'],
        'num_voted_users': +row['num_voted_users'],
        'cast_total_facebook_likes': +row['cast_total_facebook_likes'],
        'actor_3_name': row['actor_3_name'],
        'facenumber_in_poster': +row['facenumber_in_poster'],
        'plot_keywords': row['plot_keywords'],
        'movie_imdb_link': +row['movie_imdb_link'],
        'num_user_for_reviews': +row['num_user_for_reviews'],
        'language': row['language'],
        'country': row['country'],
        'content_rating': row['content_rating'],
        'budget': +row['budget'],
        'title_year': +row['title_year'],
        'actor_2_facebook_likes': +row['actor_2_facebook_likes'],
        'imdb_score': +row['imdb_score'],
        'aspect_ratio': +row['aspect_ratio'],
        'movie_facebook_likes': +row['movie_facebook_likes']
    };
}
