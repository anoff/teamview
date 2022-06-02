    var mineRank = '11',
        mineType = 'D',
        position = 7;

    function calculateHourlyMineProduction(type, rank, position){
        // console.log(type);
        // console.log(rank);
        // console.log(position);

        var result = '',
            coefficient = '';

        if ( type == 'M'){
            coefficient = 30;
        } else if ( type == 'K'){
            coefficient = 20;
        }

        if ( (type == 'M') || (type == 'K') ){
            result = Math.round(coefficient * rank * Math.pow(1.1, rank));
        } else if ( type == 'D'){
            coefficient = 10;
            result = Math.round(coefficient * rank * Math.pow(1.1, rank) * (1.28 - 0.002 * getAverageMaxTemperature(position)));
        } else {
            return "ERROR"
        }

        return result;

    }

    function getAverageMaxTemperature (position){
        var listAverageMaxTemperature = [ 240, 190, 140, 90, 80, 70, 60, 50, 40, 30, 20, 10, -30, -70, -110];
        var AverageMaxTemperature = listAverageMaxTemperature[position - 1];
        console.log("AverageMaxTemperature : " + AverageMaxTemperature);
        return AverageMaxTemperature;
    }

   calculateHourlyMineProduction(mineType, mineRank, position);
