import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { Map, Marker, TileLayer } from 'react-leaflet'
import { LeafletMouseEvent } from 'leaflet'

import logo from '../../assets/logo.svg'
import './styles.css'


import { api, apiIBGE } from '../../services/api'

interface Item {
    id: number,
    title: string,
    image_url: string
}

interface IBGEUfResponse {
    sigla: string
}

interface IBGECityResponse {
    nome: string
}


const CreatePoint = () => {
    const history = useHistory()

    const [items, setItems] = useState<Item[]>([])
    const [ufs, setUf] = useState<string[]>([])
    const [cities, setCities] = useState<string[]>([])
    const [initalPosition, setInitialPosition] = useState<[number, number]>([0, 0])
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    })
    const [selectedItems, setSelectedItems] = useState<number[]>([])

    const [selectedCity, setSelectedCity] = useState('0')
    const [selectedUf, setSelectedUf] = useState('0')

    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);



    useEffect(() => {
        navigator.geolocation.getCurrentPosition(({ coords }) => {
            setInitialPosition([coords.latitude, coords.longitude])
        })
    }, [])

    useEffect(() => {
        const getItems = async () => {
            try {
                const response = await api.get('/items')
                setItems(response.data.serializeItem)

            } catch (error) {
                alert('Deu ruim')
            }
        }
        getItems()
    }, [])

    useEffect(() => {
        const getRegionsUf = async () => {
            try {
                const response = await apiIBGE.get<IBGEUfResponse[]>(`/estados`)
                const initials = response.data.map(uf => uf.sigla)
                setUf(initials)

            } catch (error) {
                alert("Erro ao buscar uf's")
            }
        }
        getRegionsUf()
    }, [])

    useEffect(() => {
        if (selectedUf === '0') {
            return
        }
        const getCitys = async () => {
            try {
                const response = await apiIBGE.get<IBGECityResponse[]>(`/estados/${selectedUf}/municipios`)
                const cityNames = response.data.map(city => city.nome)
                setCities(cityNames)

            } catch (error) {
                alert('Erro ao buscar municipios')
            }
        }
        getCitys()
    }, [selectedUf])


    const handleSelectedUF = (event: ChangeEvent<HTMLSelectElement>) => {
        const uf = event.target.value
        setSelectedUf(uf)
    }

    const handleSelectedCity = (event: ChangeEvent<HTMLSelectElement>) => {
        const city = event.target.value
        setSelectedCity(city)
    }

    const handleMapClick = (event: LeafletMouseEvent) => {
        const { lat, lng } = event.latlng
        setSelectedPosition([lat, lng])
    }

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target
        setFormData({ ...formData, [name]: value })
    }

    const handleSelectItem = (itemId: number) => {
        const alreadySelected = selectedItems.findIndex(item => item === itemId)

        if (alreadySelected >= 0) {
            const filteredItems = selectedItems.filter(item => item !== itemId)
            setSelectedItems(filteredItems)
        }
        else {
            setSelectedItems([...selectedItems, itemId])
        }
    }

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        const { name, email, whatsapp } = formData
        const uf = selectedUf
        const city = selectedCity
        const [latitude, longitude] = selectedPosition
        const items = selectedItems

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        }
        try {
            await api.post('/points', data)

            history.push('/')
        } catch (error) {
            alert('Erro ao criar o ponto de coleta')
        }
    }


    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta" />
                <Link to='/'>
                    <FiArrowLeft />
                  Voltar para home
                </Link>
            </header>
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br /> ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da Entidade</label>
                        <input onChange={handleInputChange} type="text" name="name" id="name" />
                    </div>
                    <div className="field-group">

                        <div className="field">
                            <label htmlFor="email">Email</label>
                            <input onChange={handleInputChange} type="text" name="email" id="email" />
                        </div>

                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input onChange={handleInputChange} type="text" name="whatsapp" id="whatsapp" />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                    </legend>

                    <Map center={initalPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select onChange={handleSelectedUF} value={selectedUf} name="uf" id="uf">
                                <option value="0">Selecione um Estado</option>
                                {ufs.map(uf => (
                                    <option value={uf} key={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="cuty">Cidade</label>
                            <select name="city" onChange={handleSelectedCity} value={selectedCity} id="city">
                                <option value="0">Selecione uma cidade</option>
                                {
                                    cities.map(nome => (
                                        <option key={nome} value={nome}>{nome}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                            <li key={item.id} onClick={() => handleSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' : ''} >
                                <img src={item.image_url} alt="teste" />
                                <span>{item.title}</span>
                            </li>))
                        }


                    </ul>
                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    )
}

export default CreatePoint