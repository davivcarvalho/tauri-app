import '@mantine/core/styles.css'
import { Alert, Button, Checkbox, Flex, List, Loader, MantineProvider, TextInput, Title, createTheme } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAccessPoint, IconAccessPointOff, IconCircleDot, IconInfoCircle } from '@tabler/icons-react'
import { useState } from 'react'
import { CustomLoader } from './components/Loader/CustomLoader'
import { zodResolver } from 'mantine-form-zod-resolver'
import { z } from 'zod'

const theme = createTheme({
  components: {
    Loader: Loader.extend({
      defaultProps: {
        loaders: { ...Loader.defaultLoaders, custom: CustomLoader },
        type: 'custom',
      },
    }),
  },
})
enum ConnectionStatus { "IDDLE", 'SUCCESS', "FAIL", "TESTING" }

const schema = z.object({
  monitorIp: z.string().ip({ version: 'v4', message: 'Endereço de IP inválido' }).optional().or(z.literal('')),
  radioOneIp: z.string().ip({ version: 'v4', message: 'Endereço de IP inválido' }).optional().or(z.literal('')),
  radioTwoIp: z.string().ip({ version: 'v4', message: 'Endereço de IP inválido' }).optional().or(z.literal('')),
  radioThreeIp: z.string().ip({ version: 'v4', message: 'Endereço de IP inválido' }).optional().or(z.literal(''))
});


function App() {
  const icon = <IconInfoCircle />;

  const [monitorConnStt, setMonitorConnStt] = useState<ConnectionStatus>(ConnectionStatus.IDDLE)
  const [radioOneConnStt, setRadioOneConnStt] = useState<ConnectionStatus>(ConnectionStatus.IDDLE)
  const [radioTwoConnStt, setRadioTwoConnStt] = useState<ConnectionStatus>(ConnectionStatus.IDDLE)
  const [radioThreeConnStt, setRadioThreeConnStt] = useState<ConnectionStatus>(ConnectionStatus.IDDLE)
  const [directConn, setDirectConn] = useState(false)

  const form = useForm({
    initialValues: {
      monitorIp: '',
      radioOneIp: '',
      radioTwoIp: '',
      radioThreeIp: ''
    },
    validate: zodResolver(schema)
  })

  const getStatusIcon = (status: ConnectionStatus) => {
    if (status === ConnectionStatus.FAIL) return <IconAccessPointOff color='#F06418' />
    if (status === ConnectionStatus.SUCCESS) return <IconAccessPoint color='#2BDD66' />
    if (status === ConnectionStatus.TESTING) return <Loader size={14} />

    return <IconCircleDot size={13} />
  }


  const testConnectivity = () => {
    if (form.validate().hasErrors) return

    setMonitorConnStt(ConnectionStatus.TESTING)
    if (!directConn) {
      setRadioOneConnStt(ConnectionStatus.TESTING)
      setRadioTwoConnStt(ConnectionStatus.TESTING)
      setRadioThreeConnStt(ConnectionStatus.TESTING)
    }



    setTimeout(() => {

      setMonitorConnStt(ConnectionStatus.SUCCESS)
      if (!directConn) {
        setRadioOneConnStt(ConnectionStatus.FAIL)
        setRadioTwoConnStt(ConnectionStatus.SUCCESS)
        setRadioThreeConnStt(ConnectionStatus.FAIL)
      }

    }, 3000)
  }



  return (
    <MantineProvider theme={theme}>
      <Flex
        p={10}
        pt={30}
        direction='column'
      >
        <Title size={20} > SCM Ping Tool </Title>
        <Alert variant="light" color="blue" title="Nota" icon={icon} mt={20}>
          Este aplicativo permite testar a conectividade entre o computador e o monitor SCM Sarclad.
          <br />
          <br />
          Aguarde 5 minutos após ligar o monitor, caso o problema de conectividade persista verifique:
          <List withPadding mt={5}>
            <List.Item>O computador está conectado na rede wifi?</List.Item>
            <List.Item>O monitor está em um local aberto ou totalmente inserido no veio?</List.Item>
          </List>
        </Alert>
        <Flex
          pt={40}
          justify={'space-evenly'}
          direction={'row'}
        >
          <Flex
            direction={'column'}
          >
            <Title size={13}>Monitor</Title>
            <TextInput
              mt={15}
              description="Insira o IP do monitor SCM Sarclad "
              {...form.getInputProps('monitorIp')}
              rightSection={getStatusIcon(monitorConnStt)}
            />
          </Flex>
          <Flex direction={'column'}
          >

            <Title size={13}>Radios WiFi</Title>
            <TextInput
              disabled={directConn}
              mt={15}
              description="Insira o IP do radio 1"
              rightSection={getStatusIcon(radioOneConnStt)}

              {...form.getInputProps('radioOneIp')}
            />
            <TextInput
              disabled={directConn}
              mt={15}
              description="Insira o IP do radio 2"
              {...form.getInputProps('radioTwoIp')}
              rightSection={getStatusIcon(radioTwoConnStt)}
            />

            <TextInput
              disabled={directConn}
              mt={15}
              description="Insira o IP do radio 3"
              {...form.getInputProps('radioThreeIp')}
              rightSection={getStatusIcon(radioThreeConnStt)}
            />

            <Checkbox
              mt={20}
              label={"Conexão direta ?"}
              checked={directConn}
              onChange={() => setDirectConn(value => !value)}
            />

          </Flex>

        </Flex>

        <Flex
          mt={55}
          justify={'center'}
          align={'center'}
        >

          <Button
            onClick={testConnectivity}

            w={200}
          >
            Testar Conectividade
          </Button>
        </Flex>

      </Flex>
    </MantineProvider>
  );
}

export default App
