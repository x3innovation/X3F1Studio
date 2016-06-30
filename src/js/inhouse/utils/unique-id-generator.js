//description: random lower case alphabet string generator, this is used for unique id for each widget

function UniqueIdGenerator()
{
	var idLength = 20;

	// //////// private members
	var characters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
					 'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];

	function getRandomIntWithinRange(min, max)
	{
	    return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	// //////// public members
	this.getId = function()
	{
		var randomId = "";

		for (var i = 0; i < idLength; ++i)
		{
			var randomIndex = getRandomIntWithinRange(0, characters.length - 1);
			randomId = randomId + characters[randomIndex];
		}

		return randomId;
	}

    this.getUuid = function()
    {
        return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(c) {
            var num = Math.random() *16 | 0, v = c === 'x' ? num : (num&0x3|0x8);

            return v.toString(16);
        });
    }
}

module.exports = new UniqueIdGenerator();