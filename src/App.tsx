import '@mantine/core/styles.css'
import { Alert, Button, Checkbox, Code, Flex, List, Loader, MantineProvider, ScrollArea, TextInput, Title, createTheme } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAccessPoint, IconAccessPointOff, IconCircleDot, IconInfoCircle } from '@tabler/icons-react'
import { useState } from 'react'
import { CustomLoader } from './components/Loader/CustomLoader'
import { zodResolver } from 'mantine-form-zod-resolver'
import { z } from 'zod'
import { Command } from '@tauri-apps/api/shell'
import { useStore } from './store'

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
  monitor: z.string().ip({ version: 'v4', message: 'Endereço de IP inválido' }).optional().or(z.literal('')),
  radioOne: z.string().ip({ version: 'v4', message: 'Endereço de IP inválido' }).optional().or(z.literal('')),
  radioTwo: z.string().ip({ version: 'v4', message: 'Endereço de IP inválido' }).optional().or(z.literal('')),
  radioThree: z.string().ip({ version: 'v4', message: 'Endereço de IP inválido' }).optional().or(z.literal(''))
});


function App() {
  const { ips, setIps, connectionsStatus, setConnectionsStatus } = useStore()

  const [directConn, setDirectConn] = useState(false)
  const [log, setLog] = useState<String[]>([])

  const form = useForm({
    initialValues: {
      monitor: '',
      radioOne: '',
      radioTwo: '',
      radioThree: ''
    },
    validate: zodResolver(schema)
  })

  const getStatusIcon = (status: ConnectionStatus) => {
    if (status === ConnectionStatus.FAIL) return <IconAccessPointOff color='#F06418' />
    if (status === ConnectionStatus.SUCCESS) return <IconAccessPoint color='#2BDD66' />
    if (status === ConnectionStatus.TESTING) return <Loader size={14} />

    return <IconCircleDot size={13} />
  }

  const testConnectivity = async () => {
    if (form.validate().hasErrors) return



    Object.keys(form.values).forEach(async (data) => {
      const device = data as unknown as keyof typeof form.values
      const deviceIp = form.values[device]

      if (!deviceIp || deviceIp.length === 0) return

      setConnectionsStatus({ [device]: ConnectionStatus.TESTING })

      const command = new Command('ping', [deviceIp, '-n', '1'], { encoding: 'utf-8' })
      await command.spawn()

      command.stdout.on('data', (data: string) => {
        setLog(log => [...log, `${device}: ${data}`])

        if (data.includes(deviceIp) && data.includes('tempo')) {
          setConnectionsStatus({ [device]: ConnectionStatus.SUCCESS })
        }

        if (data.includes('inac') || data.includes('Esgotado') || data.includes('limite')) {
          setConnectionsStatus({ [device]: ConnectionStatus.FAIL })
        }

      })
      command.on('error', data => {
        setLog(log => [...log, `${device}: ${data}`])
        setConnectionsStatus({ [device]: ConnectionStatus.FAIL })
      })

    })
  }

  return (
    <MantineProvider theme={theme}>
      <Flex
        p={10}
        pt={30}
        direction='column'
      >
        <Title size={20} > SCM Ping Tool </Title>
        <Alert variant="light" color="blue" title="Nota" icon={<IconInfoCircle />} mt={20}>
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
              {...form.getInputProps('monitor')}
              rightSection={getStatusIcon(connectionsStatus.monitor)}
            />
          </Flex>
          <Flex direction={'column'}
          >

            <Title size={13}>Radios WiFi</Title>
            <TextInput
              disabled={directConn}
              mt={15}
              description="Insira o IP do radio 1"
              rightSection={getStatusIcon(connectionsStatus.radioOne)}
              {...form.getInputProps('radioOne')}
            />
            <TextInput
              disabled={directConn}
              mt={15}
              description="Insira o IP do radio 2"
              {...form.getInputProps('radioTwo')}
              rightSection={getStatusIcon(connectionsStatus.radioTwo)}
            />

            <TextInput
              disabled={directConn}
              mt={15}
              description="Insira o IP do radio 3"
              {...form.getInputProps('radioThree')}
              rightSection={getStatusIcon(connectionsStatus.radioThree)}
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
      <Flex direction={'column'} p={10}>
        <Title size={15} >Log</Title>
        <ScrollArea mt={10} h={150}>
          <Code block>
            {JSON.stringify(connectionsStatus)}
            <br />
            {JSON.stringify(ips)}
            <br />
            {log}
          </Code>
        </ScrollArea>
      </Flex>

    </MantineProvider>
  );
}

export default App
