/**
 * Kid-friendly topics for wordlist-v2 (hand-reviewed).
 *
 * The CSV's own topic column has two catch-alls ("function_words", "everyday", ~390 words)
 * and several huge beds (describing 166, actions 164, food 138…). Every word below was
 * placed by hand, reading en + zh + pos; `words` is "|"-separated and case-sensitive
 * (so "May" the month and "may" the modal verb can live in different beds).
 * Words not listed fall back to BASE_TOPIC[csv topic] (kept as a safety net; the
 * coverage test asserts that the fallback is never needed for the shipped CSV).
 * Every topic must hold 8–60 words (tested in convert.test.ts).
 */
import type { Topic } from "./types";

export interface TopicDef extends Topic {
  words: string;
}

export const TOPICS_V2: TopicDef[] = [
  { id: "greetings", zh: "打招呼", en: "Hello & thanks", icon: "👋", color: "peach",
    words: "hello|hi|goodbye|bye|see you|please|thanks|thank you|sorry|excuse me|pardon|yes|no|OK|all right|well|oh|oh dear|wow|hooray|well done|me too|don't worry|come on|of course|welcome|you're welcome|no problem|go away|if you want|in a minute|let's" },
  { id: "pronouns", zh: "我你他", en: "Pronouns", icon: "🙋", color: "lavender",
    words: "I|me|my|mine|myself|by myself|you|your|yours|yourself|by yourself|he|him|his|himself|she|her|hers|herself|it|its|itself|we|us|our|ours|they|them|their|theirs|themselves|everyone|everybody|everything|someone|somebody|something|anyone|anybody|anything|nothing|no-one" },
  { id: "questions", zh: "问一问", en: "Question words", icon: "❓", color: "sky",
    words: "what|where|which|who|whose|how|why|when|how many|how old|how much|how often|how long" },
  { id: "littlewords", zh: "小小词", en: "Little words", icon: "🔗", color: "cream",
    words: "a|an|the|this|that|these|those|and|but|or|so|because|than|if|while|although|except|some|many|any|more|most|much|few|a few|a little|less|lot|lots|lots of|a lot|a lot of|each|every|both|another|other|such|all|enough|not|about|for|from|like|of|to|with|without|as" },
  { id: "position", zh: "在哪里", en: "Where is it?", icon: "📍", color: "sky",
    words: "at|in|on|under|behind|between|next to|in front of|above|below|near|over|opposite|along|around|by|into|out of|across|against|beside|through|among|inside|outside|up|down|off|out|here|there|upstairs|downstairs|away|ahead|forward|straight on|top|bottom|front|middle|left|right|back|side|end|corner|east|west|north|south" },
  { id: "adverbs", zh: "怎么做", en: "How?", icon: "✨", color: "mint",
    words: "again|too|very|really|just|only|quickly|slowly|badly|carefully|loudly|quietly|actually|almost|also|anyway|anywhere|either|else|even|ever|everywhere|exactly|instead|maybe|perhaps|probably|quite|somewhere|still|suddenly|together|certainly|clearly|finally|simply|however" },
  { id: "numbers", zh: "数字", en: "Numbers", icon: "🔢", color: "lavender",
    words: "zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|twenty-first|thirtieth|pair|several|half|once|twice" },
  { id: "colors", zh: "颜色形状", en: "Colours & shapes", icon: "🎨", color: "peach",
    words: "colour|black|blue|brown|green|red|white|yellow|grey|orange|pink|purple|gold|silver|light blue|dark|bright|shape|circle|square|round|line|straight|stripe|striped|spot|spotted|paper|card|metal|wood|plastic|wool|cloth" },
  { id: "family", zh: "家人朋友", en: "Family & people", icon: "👨‍👩‍👧", color: "mint",
    words: "family|father|dad|daddy|mother|mum|parent|brother|sister|grandfather|grandpa|grandmother|grandma|grandparent|grandson|granddaughter|son|daughter|uncle|aunt|cousin|husband|wife|married|baby|child|kid|boy|girl|man|woman|lady|person|people|grown-up|twins|friend|classmate|neighbour|guest|foreigner|Mr|Mrs|Ms|sir|name|surname|age|nationality" },
  { id: "body", zh: "身体", en: "My body", icon: "🧍", color: "mint",
    words: "body|head|face|hair|eye|ear|nose|mouth|lips|tongue|tooth|neck|shoulder|arm|elbow|hand|finger|thumb|fist|nail|leg|knee|foot|toe|stomach|heart|lungs|brain|bone|beard|moustache|fair|blond|curly|fat|thin|voice" },
  { id: "health", zh: "看病健康", en: "Health", icon: "🩺", color: "lavender",
    words: "health|healthy|ill|sick|matter|doctor|nurse|dentist|hospital|patient|medicine|bandage|fever|temperature|cough|sneeze|headache|earache|toothache|stomach-ache|sore|cut|fall over|hurt" },
  { id: "feelings", zh: "心情", en: "Feelings", icon: "😊", color: "peach",
    words: "happy|sad|angry|afraid|frightened|scary|bored|excited|surprised|surprise|worried|worry|glad|pleased|pleasure|lonely|interested|unhappy|merry|tired|fine|hungry|thirsty|love|hate|feel|feeling|laugh|cry|smile|yawn|wish|hope|dream|luck|lucky|fun|enjoy|miss|asleep|awake" },
  { id: "character", zh: "什么样的人", en: "What are they like?", icon: "🦸", color: "lavender",
    words: "brave|clever|smart|friendly|unfriendly|kind|unkind|naughty|polite|rude|shy|lazy|strict|hard-working|helpful|careful|active|busy|funny|silly|cute|famous|popular|rich|poor|quiet|loud|noisy|strong|weak|handsome|pretty|beautiful|ugly|alone" },
  { id: "size", zh: "大小快慢", en: "Big & small", icon: "📏", color: "sky",
    words: "big|small|little|large|huge|enormous|long|short|tall|high|low|deep|thick|heavy|light|fast|slow|quick|far|old|young|new|full|empty|whole|double|hard|soft|tight|bit" },
  { id: "goodbad", zh: "好不好", en: "Good or bad?", icon: "👍", color: "cream",
    words: "good|bad|great|nice|fantastic|brilliant|amazing|excellent|wonderful|lovely|terrible|horrible|best|better|worse|worst|wrong|correct|true|false|easy|difficult|simple|possible|necessary|important|interesting|exciting|frightening|boring|dangerous|safe|strange|unusual|special|real|same|different|successful" },
  { id: "state", zh: "什么样子", en: "What is it like?", icon: "🔍", color: "mint",
    words: "clean|dirty|tidy|untidy|dry|wet|open|closed|broken|lost|missing|fresh|ready|done|free|sure|clear|blank|own|next|last|living|human|furry|everyday|dear|foreign|wild|extinct" },
  { id: "actions", zh: "动一动", en: "Move!", icon: "🏃", color: "peach",
    words: "jump|run|walk|hop|skip|climb|swim|fly|ride|drive|kick|throw|catch|bounce|hit|hold|point|clap|wave|bow|kneel|sit|stand|lie|fall|move|carry|pull|push|drop|pick|pick up|put|hide|touch|turn|shake|hug|chase|dig|blow|whistle|shout|whisper|reach|raise|juggle|hurry|enter|go|come|leave|arrive|follow|fetch|bring|send|row|pass" },
  { id: "daily", zh: "一天的生活", en: "My day", icon: "🪥", color: "sky",
    words: "get up|wake|go to bed|go to sleep|sleep|wash|get dressed|get undressed|dress up|put on|take off|wear|eat|cooking|sweep|chore|habit|live|life|wait|stay|help|use|feed|fix|repair|turn on|turn off|look after|mix|fill|save|keep|care|breathe|burn|grow|build|make sure|marry|lose|find|look for|get to|get on|get off|prepare|share|go out" },
  { id: "thinking", zh: "想一想说一说", en: "Think & talk", icon: "💬", color: "lavender",
    words: "know|think|thought|say|talk|tell|speak|speech|chat|conversation|mean|believe|remember|memory|forget|imagine|idea|decide|choice|agree|prefer|guess|explain|describe|discuss|introduce|greet|invite|thank|call|be called|mind|find out|solve|plan|reason|problem|trouble|information|promise|secret|sound|noise|look like|happen|difference|chance|search|support" },
  { id: "helpers", zh: "常用动词", en: "Helping verbs", icon: "🧩", color: "cream",
    words: "be|can|could|do|have|have got|have to|get|give|take|make|let|would|would like|will|shall|should|must|may|might|need|want|start|begin|stop|finish|continue|try|become|appear|disappear|change|see|look|look at|show|return|act|win" },
  { id: "school", zh: "学校", en: "School", icon: "🏫", color: "mint",
    words: "school|teacher|student|pupil|class|classroom|lesson|homework|break|test|subject|English|Chinese|maths|science|history|geography|art|music|PE|language|project|group|gym|timetable|flag|board|blackboard|rule|website|online|competition" },
  { id: "stationery", zh: "文具", en: "Pencil case", icon: "✏️", color: "peach",
    words: "book|pen|pencil|crayon|eraser|rubber|ruler|glue|scissors|schoolbag|backpack|rucksack|bag|notebook|dictionary|keyboard|poster|paint" },
  { id: "study", zh: "读读写写", en: "Read & write", icon: "📖", color: "sky",
    words: "read|reading|reader|write|writer|listen|ask|answer|question|spell|learn|study|teach|draw|drawing|count|add|choose|complete|tick|cross|mistake|example|word|sentence|letter|page|part|text|story|alphabet|grammar|paragraph|underline|copy|note|list|check|repeat|understand|close|number|article|skill|practice|practise|e-book|hear" },
  { id: "fruit", zh: "水果", en: "Fruit", icon: "🍎", color: "peach",
    words: "fruit|apple|green apple|banana|grape|pear|peach|lemon|lime|mango|kiwi|pineapple|watermelon|melon|strawberry|blueberry|cherry|coconut|avocado|olive|chestnut" },
  { id: "vegetables", zh: "蔬菜", en: "Vegetables", icon: "🥕", color: "mint",
    words: "vegetable|carrot|potato|sweet potato|tomato|onion|corn|bean|pea|broccoli|cucumber|eggplant|garlic|ginger|lettuce|mushroom|pepper|green pepper|salad" },
  { id: "meals", zh: "一日三餐", en: "Meals", icon: "🍚", color: "cream",
    words: "food|breakfast|lunch|dinner|meal|picnic|bread|egg|fried egg|rice|rice ball|noodles|dumplings|meat|beef|bacon|sausage|meatballs|chicken leg|steak|burger|hamburger|hot dog|sandwich|pizza|pasta|spaghetti|soup|curry|sushi|shrimp tempura|oden|taco|falafel|flatbread|bagel|croissant|cereal|cheese|butter|honey|jam|sauce|salt|sugar|flour|taste|smell" },
  { id: "snacks", zh: "零食饮料", en: "Snacks & drinks", icon: "🧃", color: "lavender",
    words: "drink|water|milk|juice|lemonade|tea|coffee|cola|milkshake|bubble tea|coconut water|yogurt|cream|cake|cupcake|birthday cake|pie|pancake|waffle|cookie|fortune cookie|biscuit|doughnut|chocolate|sweet|candy|lollipop|ice cream|soft ice cream|shaved ice|custard|mooncake|chips|fries|french fries|popcorn|pretzel|snack|delicious" },
  { id: "kitchen", zh: "厨房餐桌", en: "Kitchen", icon: "🍽️", color: "sky",
    words: "kitchen|cup|glass|bottle|plate|bowl|dish|knife|fork|spoon|chopsticks|fork and knife|lunch box|fridge|cooker|oven|piece|basket|bucket|apron" },
  { id: "pets", zh: "宠物农场", en: "Pets & farm", icon: "🐶", color: "mint",
    words: "animal|pet|dog|puppy|cat|kitten|kitty|rabbit|bunny|mouse|rat|hamster|chicken|chick|duck|goose|turkey|cow|horse|pig|piglet|sheep|goat|donkey|llama|cage|tail|fur" },
  { id: "wild", zh: "野生动物", en: "Wild animals", icon: "🦁", color: "cream",
    words: "zoo|bear|polar bear|lion|tiger|leopard|elephant|giraffe|zebra|monkey|gorilla|panda|koala|kangaroo|fox|wolf|deer|hippo|rhino|squirrel|camel|bison|skunk|sloth|otter|beaver|raccoon|hedgehog|bat|crocodile|lizard|snake|frog|tortoise|turtle|dinosaur|creature" },
  { id: "critters", zh: "鸟儿虫子海洋", en: "Birds, bugs & sea", icon: "🐞", color: "sky",
    words: "bird|nest|wing|owl|parrot|dove|eagle|flamingo|peacock|penguin|swan|fish|tropical fish|shark|whale|dolphin|seal|octopus|squid|crab|lobster|shrimp|jellyfish|shell|bee|ant|beetle|butterfly|caterpillar|cricket|insect|ladybird|mosquito|spider|snail|worm" },
  { id: "home", zh: "我的家", en: "My home", icon: "🏠", color: "peach",
    words: "home|house|flat|apartment|room|bedroom|bathroom|living room|dining room|hall|balcony|basement|stair|roof|wall|floor|door|window|gate|garden|yard|lift|elevator|bed|chair|desk|table|sofa|couch|armchair|bookcase|cupboard|shelf|lamp|mirror|rug|mat|blanket|cushion|shower|bath|toilet|seat|swing|address|key|entrance|step|fan" },
  { id: "things", zh: "生活用品", en: "Things we use", icon: "📱", color: "lavender",
    words: "thing|box|phone|telephone|mobile|watch|clock|camera|computer|laptop|tablet|radio|television|TV|screen|Internet|app|email|message|diary|envelope|stamp|postcard|mail|post|toothbrush|toothpaste|towel|soap|shampoo|brush|comb|candle|vase|button|ribbon|album|tool|machine|bell|garbage|bin|picture|photo|take a photo|umbrella" },
  { id: "toys", zh: "玩具童话", en: "Toys & stories", icon: "🧸", color: "cream",
    words: "toy|doll|teddy|robot|balloon|kite|board game|game|puzzle|model|alien|monster|ghost|fairy|treasure|pirate|king|queen|prince|princess|palace|castle|dragon|unicorn|magazine|comic|comic book|cartoon" },
  { id: "clothes", zh: "衣服", en: "Clothes", icon: "👕", color: "peach",
    words: "clothes|shirt|T-shirt|dress|skirt|trousers|pants|jeans|shorts|jacket|coat|sweater|pyjamas|swimsuit|costume|sock|shoe|boots|trainers|hat|cap|baseball cap|helmet|scarf|glove|belt|pocket|glasses|sunglasses|handbag|ring|necklace|bracelet|crown|jewellery|haircut|uniform" },
  { id: "transport", zh: "交通出行", en: "Getting around", icon: "🚌", color: "sky",
    words: "car|bus|bike|bicycle|boat|ship|train|plane|aeroplane|helicopter|lorry|truck|van|taxi|jeep|tractor|ambulance|fire engine|police car|racing car|motorbike|scooter|tram|trolleybus|subway|monorail|high-speed train|cable car|ferry|canoe|speedboat|sled|sledge|rocket|spaceship|flying saucer|parachute|wheelchair|wheel|tyre|engine|anchor|driver|passenger|ticket|platform|railway|motorway|traffic|traffic light|stop sign|crossing|gas station|road" },
  { id: "places", zh: "城市地点", en: "Places in town", icon: "🏙️", color: "mint",
    words: "place|street|city|town|village|hometown|country|China|area|way|map|building|shop|store|bookshop|bookstore|supermarket|market|shopping centre|park|playground|farm|station|bus station|bus stop|car park|café|restaurant|hotel|bank|cinema|theatre|museum|library|circus|funfair|centre|sports centre|swimming pool|pool|club|college|university|airport|bridge|tower|skyscraper|stadium|factory|fire station|police station|post office|church|temple|office|sign|path" },
  { id: "shopping", zh: "买东西", en: "Shopping", icon: "🛒", color: "peach",
    words: "buy|sell|shopping|go shopping|money|dollar|price|pay|sale|cheap|expensive|spend|size|pack|kilogram|metre|kilometre|degree|borrow" },
  { id: "nature", zh: "大自然", en: "Nature", icon: "🌳", color: "mint",
    words: "nature|tree|flower|plant|seed|leaf|grass|rose|lily|field|countryside|forest|jungle|mountain|hill|rock|stone|sand|mud|beach|sea|ocean|island|lake|river|stream|pond|waterfall|cave|desert|ground|land|earth|world|planet|space|moon|star|air|fire|view|environment|pollution|shadow|exit|hole" },
  { id: "weather", zh: "天气", en: "Weather", icon: "☀️", color: "sky",
    words: "weather|sun|sunny|sunshine|rain|rainy|snow|snowy|snowman|snowball|wind|windy|cloud|cloudy|rainbow|storm|fog|foggy|ice|sky|hot|warm|cold|cool" },
  { id: "time", zh: "时间", en: "Time", icon: "⏰", color: "cream",
    words: "time|morning|afternoon|evening|night|midday|midnight|day|today|tonight|tomorrow|yesterday|now|then|soon|later|ago|already|yet|at the moment|moment|early|late|always|usually|often|sometimes|never|before|after|during|until|hour|minute|o'clock|quarter|a.m|p.m|past|future|century" },
  { id: "calendar", zh: "星期月份", en: "Days & months", icon: "📅", color: "lavender",
    words: "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|week|weekend|month|year|date|calendar|schedule|season|spring|summer|autumn|winter|birthday|holiday|vacation" },
  { id: "sports", zh: "运动", en: "Sports", icon: "⚽", color: "peach",
    words: "sport|ball|football|soccer|basketball|baseball|volleyball|badminton|tennis|table tennis|tennis racket|ping-pong|hockey|golf|swimming|cycling|hiking|climbing|fishing|skateboard|skateboarding|skate|ice skates|ice skating|roller skates|roller skating|ski|snowboard|snowboarding|sail|surf|exercise|goal|net|score|team|player|member|match|race|winner|prize|Olympics|join|play" },
  { id: "hobbies", zh: "音乐爱好", en: "Music & hobbies", icon: "🎵", color: "lavender",
    words: "hobby|favourite|sing|song|dance|dancing|band|guitar|piano|violin|drum|instrument|concert|tune|pop music|rock music|opera|drama|film|movie|video|painting|chess|quiz|collect|collection|design|stage|record|invent|poem|exhibition|contest|programme" },
  { id: "festivals", zh: "节日旅行", en: "Parties & trips", icon: "🎉", color: "cream",
    words: "party|present|gift|festival|celebration|celebrate|Christmas|invitation|activity|adventure|trip|travel|tour|journey|visit|camp|tent|suitcase|torch|flashlight|explore|pyramid|meet|peace" },
  { id: "jobs", zh: "职业", en: "Jobs", icon: "👩‍🚒", color: "mint",
    words: "job|work|worker|farmer|clown|actor|artist|singer|musician|pop star|film star|astronaut|pilot|sailor|fisherman|postman|police|police officer|fire fighter|engineer|scientist|designer|mechanic|photographer|journalist|reporter|waiter|waitress|businessman|business|manager|meeting|news|newspaper|company|cook" },
];

/** Safety net only: CSV topic → new topic id. */
export const BASE_TOPIC: Record<string, string> = {
  function_words: "littlewords", everyday: "things", describing: "state", actions: "helpers", food: "meals", sports: "sports",
  animals: "wild", home: "things", places: "places", school: "study", time: "time", numbers: "numbers", transport: "transport",
  clothes: "clothes", family: "family", body: "body", nature: "nature", jobs: "jobs", health: "health", colors: "colors",
  weather: "weather", toys: "toys", materials: "colors",
};
