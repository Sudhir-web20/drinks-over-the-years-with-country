import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { ArrowDown, ArrowDownUp, ArrowUpRight, CircleHelp, Clock3, Droplets, Globe2, Grid2X2, Leaf, List, Search, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { categories, drinks, type Drink } from '@/lib/drinks';
import { getDrinkStory } from '@/lib/drink-story.functions';
import { OnboardingTour } from '@/components/onboarding-tour';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Sip — 25 Iconic Drinks Through History' },
    { name: 'description', content: 'From Guinness in 1759 to Monster in 2002. Explore 25 iconic drinks, their origins, flavors, and AI-powered stories.' },
    { property: 'og:title', content: 'Sip — 25 Iconic Drinks Through History' },
    { property: 'og:description', content: 'An interactive drinks archive spanning 243 years of extraordinary stories.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: DrinksArchive,
});

function DrinksArchive() {
  const [category, setCategory] = useState<string>('All drinks');
  const [search, setSearch] = useState('');
  const [reverse, setReverse] = useState(false);
  const [view, setView] = useState<'collection'|'timeline'>('collection');
  const [selected, setSelected] = useState<Drink|null>(null);
  const [replay, setReplay] = useState(0);
  const filtered = useMemo(()=>drinks.filter(d => (category==='All drinks'||d.category===category) && `${d.name} ${d.country} ${d.type} ${d.year}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>reverse ? b.year-a.year : a.year-b.year),[category,search,reverse]);
  const reset = () => {setCategory('All drinks');setSearch('');setReverse(false);};
  return <MotionConfig reducedMotion="user"><div className="archive">
    <header className="site-header page-width">
      <a href="/" className="wordmark" aria-label="Sip home"><Droplets aria-hidden="true"/>sip<span>.</span></a>
      <nav aria-label="Archive views" className="main-nav" data-tour="views">
        <Button variant="ghost" className={view==='collection'?'nav-item active':'nav-item'} onClick={()=>setView('collection')}>Collection</Button>
        <Button variant="ghost" className={view==='timeline'?'nav-item active':'nav-item'} onClick={()=>setView('timeline')}>Timeline</Button>
      </nav>
      <div className="header-right">
        <Button variant="ghost" className="tour-replay" onClick={()=>setReplay(r=>r+1)}><CircleHelp size={14}/> Tour</Button>
        <span className="header-note"><span className="status-dot"/> A little history. A lot of flavor.</span>
      </div>
    </header>
    <main className="page-width">
      <section className="intro">
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.6}}>
          <div className="eyebrow"><span className="tiny-line"/> THE DRINKS ARCHIVE <span className="volume">VOL. 01</span></div>
          <h1>Iconic drinks.<br/><span>Extraordinary stories.</span></h1>
          <p>Some drinks are more than a drink. Discover the origins,<br className="desktop-break"/> flavors, and little-known stories behind 25 timeless icons.</p>
          <a href="#collection" className="explore-link">A journey through every sip <ArrowDown size={15}/></a>
        </motion.div>
        <div className="archive-stats"><div><strong>25<span>↗</span></strong><small>ICONIC DRINKS</small></div><div><strong>243</strong><small>YEARS OF HISTORY</small></div><div className="stats-period">1759 <span>—</span> 2002</div></div>
      </section>
      <section id="collection" className="collection-section">
        <div className="collection-heading"><div><h2>{view==='collection'?'The collection':'Through the years'} <span>{String(filtered.length).padStart(2,'0')}</span></h2><p>A taste of history, from oldest to newest.</p></div><div className="display-controls" data-tour="layout"><span className="display-label">VIEW</span><Button variant="ghost" size="icon" aria-label="Mosaic view" title="Mosaic view" onClick={()=>setView('collection')} className={view==='collection'?'view-button active':'view-button'}><Grid2X2/></Button><Button variant="ghost" size="icon" aria-label="Timeline view" title="Timeline view" onClick={()=>setView('timeline')} className={view==='timeline'?'view-button active':'view-button'}><List/></Button></div></div>
        <div className="collection-toolbar"><div className="category-tabs" aria-label="Filter drinks" data-tour="filters">{categories.map(c=><Button key={c} variant="ghost" aria-pressed={category===c} className={`category-tab ${category===c?'selected':''}`} onClick={()=>setCategory(c)}>{c}{c==='All drinks'&&<span>25</span>}</Button>)}</div><div className="search-sort"><label className="search-box" data-tour="search"><Search size={16}/><input aria-label="Search drinks" placeholder="Find your drink..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<Button variant="ghost" size="icon" aria-label="Clear search" onClick={()=>setSearch('')}><X/></Button>}</label><Button variant="ghost" size="icon" data-tour="sort" title={reverse?'Newest first':'Oldest first'} aria-label={reverse?'Sort oldest first':'Sort newest first'} onClick={()=>setReverse(!reverse)}><ArrowDownUp/></Button></div></div>
        <motion.div layout className={view==='collection'?'drink-grid':'timeline-list'}>
          <AnimatePresence mode="popLayout">{filtered.map((drink,i)=><DrinkCard key={drink.id} drink={drink} featured={view==='collection'&&i===0&&!search&&category==='All drinks'} view={view} tour={view==='collection'&&i===0&&!search&&category==='All drinks'?'card':undefined} onOpen={()=>setSelected(drink)}/>)}</AnimatePresence>
        </motion.div>
        {!filtered.length&&<div className="empty-state"><Search size={30}/><h3>No drinks found</h3><p>Nothing in the archive matches “{search}”.</p><Button variant="outline" onClick={reset}>Clear filters</Button></div>}
        <div className="collection-end"><span className="tiny-line"/><span>{filtered.length===25?'25 icons. Countless stories.':`${filtered.length} drinks in this selection.`}</span><span className="tiny-line"/></div>
      </section>
    </main>
    <footer className="page-width site-footer"><a href="/" className="footer-brand">sip.</a><span>Good taste has a history.</span><span className="footer-note">AN INDEPENDENT DRINKS ARCHIVE · EST. 2026</span></footer>
    <OnboardingTour replay={replay} onPrepare={()=>{setView('collection');reset();setSelected(null);}} onOpenFeatured={()=>setSelected(drinks[0] ?? null)}/>
    <Dialog open={selected!==null} onOpenChange={open=>{if(!open)setSelected(null);}}>{selected&&<DrinkDetails key={selected.id} drink={selected}/>}</Dialog>
  </div></MotionConfig>;
}

function DrinkCard({drink,featured,view,tour,onOpen}:{drink:Drink;featured:boolean;view:string;tour?:string|undefined;onOpen:()=>void}) {
  return <motion.div layout data-tour={tour} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:.97}} transition={{duration:.3}} className={`drink-tile tone-${drink.number%5} ${featured?'featured':''} ${view==='timeline'?'timeline-tile':''}`}>
    <Button variant="ghost" className="drink-card" onClick={onOpen} aria-label={`Explore ${drink.name}`}>
      <div className="tile-top"><span className="drink-category">{featured&&<span className="featured-label"><span/>THE ORIGINAL ICON</span>}{!featured&&drink.type}</span><span className="index-number">{String(drink.number).padStart(2,'0')} / 25</span></div>
      <span className="year-watermark" aria-hidden="true">{drink.year}</span>
      <div className="product-image"><img src={drink.image} alt={`${drink.name} ${drink.type}`} width={384} height={384} loading={drink.number<5?'eager':'lazy'}/></div>
      <div className="tile-bottom"><div><div className="origin"><span>{drink.flag}</span> {drink.country} <span className="origin-dot">·</span> EST. {drink.year}</div><h3>{drink.name}</h3>{featured&&<p>A Dublin original. A worldwide legend.</p>}</div><span className="card-arrow"><ArrowUpRight size={20}/></span></div>
      {featured&&<span className="featured-footnote">Where the collection begins.</span>}
    </Button>
  </motion.div>;
}

function DrinkDetails({drink}:{drink:Drink}) {
  const [story,setStory]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  useEffect(()=>{let current=true;getDrinkStory({data:{id:drink.id}}).then(result=>{if(!current)return;setStory(result.text??'');setError(result.error??'');setLoading(false);}).catch(()=>{if(current){setError('The story could not load. Please try again later.');setLoading(false);}});return()=>{current=false;};},[drink.id]);
  return <DialogContent className="drink-dialog"><div className={`detail-visual tone-${drink.number%5}`}><span className="detail-index">THE DRINKS ARCHIVE / {String(drink.number).padStart(2,'0')}</span><span className="detail-year">{drink.year}</span><motion.img initial={{opacity:0,y:25,rotate:-4}} animate={{opacity:1,y:0,rotate:0}} transition={{duration:.5}} src={drink.image} alt={drink.name} width={384} height={384}/><span className="detail-visual-bottom">{drink.flag} {drink.country}</span></div><div className="detail-body"><div className="eyebrow">{drink.category.toUpperCase()} <span>·</span> EST. {drink.year}</div><DialogTitle className="detail-title">{drink.name}</DialogTitle><DialogDescription className="detail-description">{drink.type}</DialogDescription><p className="detail-story">{drink.story}</p><div className="detail-facts"><div><Globe2/><small>ORIGIN</small><strong>{drink.country}</strong></div><div><Clock3/><small>ARCHIVE YEAR</small><strong>{drink.year}</strong></div></div><div className="taste-notes"><Leaf size={16}/><span>{drink.taste}</span></div><div className="did-you-know"><span>THE LITTLE-KNOWN DETAIL</span><p>{drink.fact}</p></div><section className="ai-story"><h3><Sparkles size={17}/> Beyond the label <span>AI EXPLORATION</span></h3>{loading?<div className="ai-loading" role="status"><span/><p>Uncovering the story…</p><div className="skeleton-line"/><div className="skeleton-line"/><div className="skeleton-line short"/></div>:error?<p className="ai-error" role="alert">{error}</p>:story.split('\n').filter(Boolean).map((p,i)=><motion.p key={i} initial={{opacity:0}} animate={{opacity:1}}>{p}</motion.p>)}<small className="ai-disclaimer">AI-generated context. Historical dates follow the original collection; recipes and formulations may vary by market.</small></section></div></DialogContent>;
}
