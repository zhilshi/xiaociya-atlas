/**
 * Pictures for wordlist-v2 words that the v1 lexicon did not have (v1 words keep their v1 emoji).
 * Only words with an emoji a child would actually recognise are listed; everything else
 * (function words, abstract nouns, most adjectives) gets a clean letter + Chinese gloss card
 * instead of a misleading picture. "|"-separated `word=emoji` pairs, case-sensitive.
 */
const RAW = `
hello=👋|hi=👋|goodbye=👋|bye=👋|please=🙏|thanks=🙏|thank you=🙏|sorry=😔|yes=✅|no=❌|OK=👌|all right=👌|wow=😮|hooray=🎉|well done=👏|welcome=🤗|you're welcome=🤗|oh dear=😟|don't worry=🤗
I=🙋|me=🙋|we=👫|they=👨‍👩‍👧|he=👦|she=👧|him=👦|her=👧|everyone=👨‍👩‍👧‍👦|everybody=👨‍👩‍👧‍👦|nothing=🫙|something=🎁
what=❓|where=❓|who=❓|why=❓|how many=🔢|how old=🎂|how much=💰|how long=⏳|when=🕒
under=⬇️|above=⬆️|up=⬆️|down=⬇️|left=⬅️|right=➡️|top=🔝|inside=📦|outside=🚪|upstairs=⬆️|downstairs=⬇️|forward=⏩|back=🔙|north=🧭|south=🧭|east=🧭|west=🧭|corner=📐|end=🏁|between=↔️
quickly=⚡|slowly=🐢|quietly=🤫|loudly=📢|together=🤝|maybe=🤔|perhaps=🤔|again=🔁|finally=🏁|suddenly=💥
zero=0️⃣|hundred=💯|thousand=🔢|million=🔢|first=🥇|second=🥈|third=🥉|pair=👟|half=🌓|once=☝️|twice=✌️
colour=🎨|dark=🌑|bright=🌞|shape=🔷|circle=⭕|square=🟥|round=⚪|line=📏|stripe=🦓|striped=🦓|spot=🐞|spotted=🐆|paper=📄|card=💌|metal=🔩|wood=🪵|plastic=🧴|wool=🧶|cloth=🧵
dad=👨|daddy=👨|mum=👩|parent=👨‍👩‍👧|grandpa=👴|grandma=👵|grandson=👦|granddaughter=👧|son=👦|daughter=👧|married=💍|kid=🧒|boy=👦|girl=👧|man=👨|woman=👩|lady=👩|person=🧑|people=👥|grown-up=🧑|friend=🧑‍🤝‍🧑|classmate=🧑‍🎓|neighbour=🏘️|guest=🛎️|foreigner=🌍|name=📛|surname=📛|age=🎂|nationality=🌍
neck=🦒|shoulder=💪|elbow=💪|knee=🦵|toe=🦶|stomach=🫃|moustache=🥸|blond=👱|curly=🧑‍🦱|voice=🗣️
health=💪|healthy=🥦|ill=🤒|sick=🤒|doctor=🧑‍⚕️|nurse=🧑‍⚕️|dentist=🦷|hospital=🏥|patient=🛌|medicine=💊|bandage=🩹|fever=🤒|temperature=🌡️|cough=😷|headache=🤕|earache=👂|toothache=🦷|stomach-ache=🤢|sore=🤕|fall over=🤸|hurt=🤕
happy=😀|sad=😢|angry=😠|afraid=😨|frightened=😨|scary=👻|bored=🥱|excited=🤩|surprised=😲|surprise=🎁|worried=😟|worry=😟|glad=😊|pleased=😊|lonely=😔|interested=🧐|unhappy=☹️|merry=🎄|tired=😪|hungry=😋|thirsty=🥤|hate=😖|feel=💗|feeling=💗|wish=🌠|hope=🤞|dream=💭|luck=🍀|lucky=🍀|fun=🎈|enjoy=😄|asleep=😴|awake=👀
brave=🦁|clever=💡|smart=🧠|friendly=🤝|kind=💝|naughty=😜|polite=🙇|rude=😤|shy=🙈|lazy=🦥|strict=🧑‍🏫|hard-working=🐝|helpful=🤲|careful=⚠️|active=🏃|busy=🐝|funny=😂|silly=🤪|cute=🐣|famous=🌟|rich=💰|quiet=🤫|loud=📢|noisy=📢|strong=💪|weak=🥀|pretty=🌸|beautiful=🌸|alone=🧍
big=🐘|small=🐭|little=🐜|large=🐘|huge=🐋|enormous=🦕|long=🐍|short=📏|tall=🦒|high=⛰️|low=⬇️|deep=🌊|heavy=🏋️|light=🪶|fast=⚡|slow=🐢|quick=⚡|far=🔭|old=👴|young=👶|new=✨|full=🈵|empty=🫙|hard=🪨|soft=🧸|bit=🤏
good=👍|bad=👎|great=👍|nice=😊|fantastic=🤩|brilliant=🌟|amazing=🤩|excellent=💯|wonderful=🌈|lovely=💕|terrible=😱|horrible=😱|best=🏆|wrong=❌|correct=✅|true=✅|false=❌|easy=😌|difficult=😓|dangerous=⚠️|safe=🛡️|strange=👽|special=⭐|same=🟰|different=🔀|exciting=🎢|boring=🥱
clean=🧼|tidy=🧹|untidy=🗑️|dry=🌵|wet=💦|closed=🔒|broken=💔|lost=🧭|fresh=🌿|ready=🏁|free=🆓|human=🧑|furry=🐻|wild=🐺|extinct=🦖
hop=🐇|skip=🪢|drive=🚗|bounce=🏀|hit=🏏|hold=🤲|lie=🛌|fall=🍂|move=🚚|carry=🎒|pull=🪢|push=🛒|drop=💧|pick=🍎|pick up=🤲|put=📥|hide=🙈|touch=👆|turn=🔄|shake=🤝|chase=🏃|dig=⛏️|blow=🌬️|whistle=😗|shout=📢|reach=🙋|raise=🙋|hurry=🏃|enter=🚪|go=🚶|come=👋|leave=🚪|arrive=🛬|follow=👣|fetch=🐕|bring=🎁|send=📨|pass=🏉
get up=⏰|wake=⏰|go to bed=🛏️|go to sleep=😴|get dressed=👕|get undressed=👕|dress up=🎭|put on=🧥|take off=🧥|wear=👗|cooking=🍳|sweep=🧹|chore=🧹|live=🏡|life=🌱|wait=⏳|help=🆘|feed=🍼|fix=🔧|repair=🔧|turn on=💡|turn off=💡|look after=🤱|mix=🥣|fill=🫗|save=💾|breathe=🌬️|burn=🔥|grow=🌱|marry=💒|lose=😞|find=🔍|look for=🔍|get on=🚌|get off=🚌|prepare=🧑‍🍳|share=🤝|go out=🚪
know=💡|thought=💭|say=💬|talk=💬|tell=🗣️|speak=🗣️|speech=🎤|chat=💬|conversation=💬|remember=🧠|memory=🧠|forget=🤷|imagine=💭|idea=💡|decide=🤔|agree=🤝|guess=🤔|explain=🧑‍🏫|introduce=🤝|greet=👋|invite=💌|thank=🙏|call=📞|solve=🧩|plan=🗺️|problem=❓|trouble=😣|information=ℹ️|promise=🤞|secret=🤫|sound=🔊|noise=🔊|search=🔍|support=🤝
see=👀|look at=👀|show=👉|start=▶️|begin=▶️|stop=🛑|finish=🏁|try=💪|appear=✨|disappear=💨|change=🔄|win=🏆|give=🎁|take=🤲|make=🛠️|have=🤲|want=🙋|need=🙋|can=💪|act=🎭
school=🏫|teacher=🧑‍🏫|student=🧑‍🎓|pupil=🧑‍🎓|class=🏫|classroom=🏫|lesson=📚|homework=📝|break=⛹️|test=📝|subject=📚|English=🔤|Chinese=🀄|maths=➗|science=🔬|history=🏛️|geography=🌍|art=🎨|music=🎵|PE=🤸|language=🗣️|project=📋|group=👥|gym=🏋️|timetable=🗓️|flag=🚩|board=🧑‍🏫|blackboard=🧑‍🏫|rule=📏|website=🌐|online=🌐|competition=🏆
book=📕|pen=🖊️|pencil=✏️|crayon=🖍️|eraser=🧽|rubber=🧽|ruler=📏|glue=🧴|scissors=✂️|schoolbag=🎒|backpack=🎒|rucksack=🎒|bag=👜|notebook=📓|dictionary=📖|keyboard=⌨️|poster=🖼️
reading=📖|reader=📖|writer=✍️|ask=🙋|answer=💬|question=❓|spell=🔤|learn=📚|study=📚|teach=🧑‍🏫|drawing=🖍️|add=➕|choose=👆|complete=✅|tick=✔️|cross=❌|mistake=❌|word=🔤|sentence=📝|letter=✉️|page=📄|story=📖|alphabet=🔤|copy=📝|note=🗒️|list=📋|check=✅|repeat=🔁|number=🔢|practice=🔁|practise=🔁|e-book=📱|hear=👂
fruit=🍓|grape=🍇|lime=🍋|vegetable=🥦|bean=🫘|pea=🫛
food=🍱|breakfast=🍳|lunch=🍱|dinner=🍽️|meal=🍽️|picnic=🧺|beef=🥩|sausage=🌭|meatballs=🧆|burger=🍔|pasta=🍝|cereal=🥣|jam=🍓|sauce=🥫|sugar=🍬|flour=🌾|taste=😋|smell=👃
lemonade=🍋|milkshake=🥤|yogurt=🥛|cream=🍦|pancake=🥞|biscuit=🍪|sweet=🍬|chips=🍟|fries=🍟|snack=🍿|delicious=😋
kitchen=🍳|cup=☕|glass=🥛|bottle=🍼|dish=🍽️|knife=🔪|fork=🍴|fridge=🧊|cooker=🍳|oven=🔥|piece=🧩|basket=🧺|bucket=🪣|apron=🧑‍🍳
animal=🐾|kitty=🐱|rat=🐀|cage=🐦|tail=🐒|fur=🦊|zoo=🦓|tortoise=🐢|creature=🐾|nest=🪺|wing=🪽|shell=🐚|insect=🐛
house=🏠|flat=🏢|apartment=🏢|room=🚪|bedroom=🛏️|bathroom=🛁|living room=🛋️|dining room=🍽️|hall=🚪|balcony=🏢|basement=🏚️|stair=🪜|roof=🏠|wall=🧱|floor=🟫|door=🚪|window=🪟|gate=🚧|garden=🌻|yard=🏡|elevator=🛗|bed=🛏️|chair=🪑|desk=🪑|table=🪑|sofa=🛋️|couch=🛋️|armchair=🛋️|bookcase=📚|cupboard=🗄️|shelf=📚|lamp=💡|mirror=🪞|rug=🟫|mat=🟫|blanket=🛌|cushion=🛋️|shower=🚿|bath=🛁|toilet=🚽|seat=💺|swing=🛝|address=🏠|key=🔑|entrance=🚪|step=🪜|fan=🌀
box=📦|phone=📱|telephone=☎️|mobile=📱|watch=⌚|clock=⏰|camera=📷|computer=💻|laptop=💻|tablet=📱|radio=📻|television=📺|TV=📺|screen=🖥️|Internet=🌐|app=📱|email=📧|message=💬|diary=📔|envelope=✉️|stamp=📮|postcard=💌|mail=📬|post=📮|toothbrush=🪥|toothpaste=🪥|towel=🧻|soap=🧼|shampoo=🧴|comb=🪮|candle=🕯️|vase=🏺|button=🔘|ribbon=🎀|album=📒|tool=🔧|machine=⚙️|bell=🔔|garbage=🗑️|bin=🗑️|picture=🖼️|photo=📸|take a photo=📸|umbrella=☂️
toy=🧸|doll=🪆|teddy=🧸|robot=🤖|balloon=🎈|kite=🪁|board game=🎲|game=🎮|puzzle=🧩|model=✈️|alien=👽|monster=👾|ghost=👻|fairy=🧚|treasure=💎|pirate=🏴‍☠️|king=🤴|queen=👸|prince=🤴|princess=👸|palace=🏰|castle=🏰|magazine=📰|comic=💥|comic book=💥|cartoon=📺
clothes=👕|shirt=👔|T-shirt=👕|dress=👗|skirt=👗|trousers=👖|pants=👖|jeans=👖|shorts=🩳|jacket=🧥|coat=🧥|sweater=🧶|pyjamas=🛌|swimsuit=🩱|costume=🎭|sock=🧦|shoe=👟|boots=🥾|trainers=👟|hat=👒|cap=🧢|baseball cap=🧢|helmet=⛑️|scarf=🧣|glove=🧤|belt=👖|pocket=👖|glasses=👓|sunglasses=🕶️|handbag=👜|ring=💍|necklace=📿|bracelet=📿|crown=👑|jewellery=💎|haircut=💇|uniform=🥋
bicycle=🚲|aeroplane=✈️|lorry=🚚|sledge=🛷|spaceship=🚀|wheel=🛞|engine=⚙️|driver=🧑‍✈️|passenger=🧳|ticket=🎫|platform=🚉|railway=🛤️|motorway=🛣️|traffic=🚦|crossing=🚸
place=📍|street=🛣️|city=🏙️|town=🏘️|village=🏡|hometown=🏡|country=🗺️|China=🇨🇳|area=🗺️|way=🧭|map=🗺️|building=🏢|store=🏪|bookshop=📚|bookstore=📚|supermarket=🛒|market=🧺|shopping centre=🛍️|park=🌳|playground=🛝|farm=🚜|bus station=🚏|car park=🅿️|café=☕|restaurant=🍽️|hotel=🏨|bank=🏦|cinema=🎬|theatre=🎭|museum=🏛️|library=📚|circus=🎪|funfair=🎡|centre=🏬|sports centre=🏟️|swimming pool=🏊|pool=🏊|club=🏸|college=🎓|university=🎓|airport=🛫|bridge=🌉|tower=🗼|skyscraper=🏙️|stadium=🏟️|factory=🏭|fire station=🚒|police station=🚓|post office=🏤|church=⛪|temple=🛕|office=🏢|sign=🪧|path=🛤️
buy=🛍️|sell=🏷️|shopping=🛍️|go shopping=🛍️|money=💰|dollar=💵|price=🏷️|pay=💳|sale=🏷️|cheap=🏷️|expensive=💎|spend=💸|size=📏|pack=📦|kilogram=⚖️|metre=📏|kilometre=🛣️|degree=🌡️|borrow=📚
nature=🌿|tree=🌳|flower=🌸|plant=🪴|seed=🌱|leaf=🍃|grass=🌱|rose=🌹|lily=🌷|field=🌾|countryside=🏞️|forest=🌲|jungle=🌴|mountain=⛰️|hill=⛰️|rock=🪨|stone=🪨|sand=🏖️|mud=🟤|beach=🏖️|sea=🌊|ocean=🌊|island=🏝️|lake=🏞️|river=🏞️|stream=🏞️|pond=🦆|waterfall=🏞️|cave=🕳️|desert=🏜️|ground=🟫|land=🏞️|earth=🌍|world=🌍|planet=🪐|space=🌌|moon=🌙|star=⭐|air=🌬️|fire=🔥|view=🏞️|environment=🌍|pollution=🏭|shadow=👤|exit=🚪|hole=🕳️
weather=🌦️|sun=☀️|sunny=☀️|sunshine=🌞|rain=🌧️|rainy=🌧️|snow=❄️|snowy=🌨️|snowman=⛄|snowball=⚪|wind=🌬️|windy=🌬️|cloud=☁️|cloudy=☁️|storm=⛈️|fog=🌫️|foggy=🌫️|sky=🌤️|hot=🥵|warm=🌤️|cold=🥶|cool=😎
time=⏰|morning=🌅|afternoon=🌤️|evening=🌆|night=🌙|midday=🕛|midnight=🕛|tonight=🌙|tomorrow=📅|yesterday=📅|now=⏱️|soon=⏳|later=⏳|early=🐓|late=⌛|always=♾️|hour=🕐|minute=⏱️|o'clock=🕐|quarter=🕒|future=🔮|century=💯
date=📅|calendar=📅|schedule=🗓️|season=🍂|spring=🌸|summer=🏖️|autumn=🍂|winter=⛄|holiday=🏖️|vacation=🏖️
sport=🏅|ball=⚽|football=⚽|soccer=⚽|basketball=🏀|baseball=⚾|volleyball=🏐|badminton=🏸|tennis=🎾|table tennis=🏓|tennis racket=🎾|ping-pong=🏓|hockey=🏑|golf=⛳|swimming=🏊|cycling=🚴|hiking=🥾|climbing=🧗|fishing=🎣|skateboarding=🛹|ice skates=⛸️|ice skating=⛸️|roller skates=🛼|roller skating=🛼|snowboard=🏂|snowboarding=🏂|sail=⛵|exercise=🤸|goal=🥅|net=🥅|score=🔢|team=👥|player=⛹️|member=🪪|match=🏟️|race=🏁|winner=🏆|prize=🏆|Olympics=🏅|join=🤝
hobby=🎨|favourite=❤️|song=🎵|dancing=💃|band=🎸|guitar=🎸|piano=🎹|violin=🎻|drum=🥁|instrument=🎼|concert=🎤|tune=🎶|pop music=🎤|rock music=🎸|opera=🎭|drama=🎭|film=🎬|movie=🎬|video=📹|painting=🖼️|chess=♟️|quiz=❓|collect=🗃️|collection=🗃️|design=📐|stage=🎭|record=⏺️|invent=💡|poem=📜|exhibition=🖼️|contest=🏆|programme=📺
party=🥳|present=🎁|gift=🎁|festival=🏮|celebration=🎊|celebrate=🎊|Christmas=🎄|invitation=💌|activity=🤸|adventure=🧭|trip=🧳|travel=✈️|tour=🗺️|journey=🧳|visit=🏡|camp=🏕️|tent=⛺|suitcase=🧳|torch=🔦|flashlight=🔦|explore=🧭|pyramid=🔺|meet=🤝|peace=🕊️
job=💼|work=💼|worker=👷|farmer=🧑‍🌾|clown=🤡|actor=🎭|artist=🧑‍🎨|singer=🧑‍🎤|musician=🧑‍🎤|pop star=🧑‍🎤|film star=🌟|astronaut=🧑‍🚀|pilot=🧑‍✈️|sailor=⚓|fisherman=🎣|postman=📮|police=👮|police officer=👮|fire fighter=🧑‍🚒|engineer=🧑‍🔧|scientist=🧑‍🔬|designer=🧑‍🎨|mechanic=🧑‍🔧|photographer=📸|journalist=📰|reporter=🎤|waiter=🧑‍🍳|waitress=🧑‍🍳|businessman=🧑‍💼|business=💼|manager=🧑‍💼|meeting=👥|news=📰|newspaper=📰|company=🏢
`;

export const EMOJI_V2: Record<string, string> = Object.fromEntries(
  RAW.trim()
    .split(/[\n|]/)
    .filter(Boolean)
    .map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i), p.slice(i + 1)];
    }),
);

/** Big digits instead of a picture for number words ("30", "1st"). */
const N: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000, million: 1000000 };
const ORD: Record<string, string> = { first: "1st", second: "2nd", third: "3rd", fourth: "4th", fifth: "5th", sixth: "6th", seventh: "7th", eighth: "8th", ninth: "9th", tenth: "10th", eleventh: "11th", twelfth: "12th", thirteenth: "13th", fourteenth: "14th", fifteenth: "15th", sixteenth: "16th", seventeenth: "17th", eighteenth: "18th", nineteenth: "19th", twentieth: "20th", "twenty-first": "21st", thirtieth: "30th" };
export function numberGlyph(en: string): string | undefined {
  if (en in N) return N[en] >= 1000 ? N[en].toLocaleString("en-US") : String(N[en]);
  return ORD[en];
}
