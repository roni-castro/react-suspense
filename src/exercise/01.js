// Simple Data-fetching
// http://localhost:3000/isolated/exercise/01.js

import * as React from 'react'
import {PokemonDataView, PokemonErrorBoundary, fetchPokemon} from '../pokemon'

function createResource(promise) {
  let status = 'pending',
    data,
    error
  let resultPromise = promise.then(
    resolved => {
      status = 'resolved'
      data = resolved
    },
    rejected => {
      status = 'rejected'
      error = rejected
    },
  )
  return {
    read() {
      if (status === 'pending') throw resultPromise
      if (status === 'rejected') throw error
      if (status === 'resolved') return data
      throw new Error('This state should be impossible')
    },
  }
}

const pokemonResource = createResource(fetchPokemon('pikachu'))

function PokemonInfo() {
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

function App() {
  return (
    <div className="pokemon-info-app">
      <div className="pokemon-info">
        <PokemonErrorBoundary>
          <React.Suspense fallback={<div>Loading Pokemon...</div>}>
            <PokemonInfo />
          </React.Suspense>
        </PokemonErrorBoundary>
      </div>
    </div>
  )
}

export default App
