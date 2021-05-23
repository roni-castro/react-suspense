// Cache resources
// http://localhost:3000/isolated/exercise/04.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonInfoFallback,
  PokemonForm,
  PokemonDataView,
  PokemonErrorBoundary,
} from '../pokemon'
import {createResource} from '../utils'

function PokemonInfo({pokemonResource}) {
  const pokemon = pokemonResource.read()
  return (
    <div>
      <div className="pokemon-info__img-wrapper">
        <img src={pokemon.image} alt={pokemon.name} />
      </div>
      <PokemonDataView pokemon={pokemon} />
    </div>
  )
}

const SUSPENSE_CONFIG = {
  timeoutMs: 4000,
  busyDelayMs: 300,
  busyMinDurationMs: 700,
}

const PokemonResourceContext = React.createContext()

function usePokemonResourceCache() {
  const context = React.useContext(PokemonResourceContext)
  if (!context) {
    throw new Error(
      'usePokemonResourceCache must used inside a component wrapped by PokemonResourceCacheProvider',
    )
  }
  return context
}

function PokemonResourceCacheProvider({cacheTime = 5000, ...otherProps}) {
  const pokemonResourceCache = React.useRef({})

  function isCacheValid(currentTime, cacheTime) {
    return Date.now() - currentTime <= cacheTime
  }

  const getPokemonResource = React.useCallback(
    name => {
      const lowerName = name.toLowerCase()
      let resource = pokemonResourceCache.current[lowerName]
      if (!resource || !isCacheValid(resource.lastUpdate, cacheTime)) {
        resource = {
          value: createPokemonResource(lowerName),
          lastUpdate: Date.now(),
        }
        pokemonResourceCache.current[lowerName] = resource
      }
      return resource.value
    },
    [cacheTime],
  )
  return (
    <PokemonResourceContext.Provider
      value={getPokemonResource}
      {...otherProps}
    />
  )
}

function createPokemonResource(pokemonName) {
  return createResource(fetchPokemon(pokemonName))
}

function App() {
  const [pokemonName, setPokemonName] = React.useState('')
  const [startTransition, isPending] = React.useTransition(SUSPENSE_CONFIG)
  const [pokemonResource, setPokemonResource] = React.useState(null)
  const getPokemonResource = usePokemonResourceCache()

  React.useEffect(() => {
    if (!pokemonName) {
      setPokemonResource(null)
      return
    }
    startTransition(() => {
      setPokemonResource(getPokemonResource(pokemonName))
    })
  }, [pokemonName, startTransition, getPokemonResource])

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleReset() {
    setPokemonName('')
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className={`pokemon-info ${isPending ? 'pokemon-loading' : ''}`}>
        {pokemonResource ? (
          <PokemonErrorBoundary
            onReset={handleReset}
            resetKeys={[pokemonResource]}
          >
            <React.Suspense
              fallback={<PokemonInfoFallback name={pokemonName} />}
            >
              <PokemonInfo pokemonResource={pokemonResource} />
            </React.Suspense>
          </PokemonErrorBoundary>
        ) : (
          'Submit a pokemon'
        )}
      </div>
    </div>
  )
}

function AppWithProvider() {
  return (
    <PokemonResourceCacheProvider>
      <App />
    </PokemonResourceCacheProvider>
  )
}

export default AppWithProvider
